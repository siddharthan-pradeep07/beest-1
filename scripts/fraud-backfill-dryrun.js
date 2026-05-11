/* eslint-disable */
// Dry-run: matches Airtable Projects (failed != true) to beest projects,
// filters out anything already on joe.fraud, and prints what would be POSTed.
// No mutations. Run from backend/ so .env loads.
const path = require('path');
const crypto = require('crypto');
const backendDir = path.join(__dirname, '..', 'backend');
require(path.join(backendDir, 'node_modules', 'dotenv')).config({
  path: path.join(backendDir, '.env'),
});
const { Client } = require(path.join(backendDir, 'node_modules', 'pg'));

// AES-256-GCM, iv.tag.ciphertext (base64), matching backend/src/crypto.util.ts
function decryptField(encoded, keyHex) {
  const parts = encoded.split('.');
  if (parts.length !== 3) throw new Error('Malformed encrypted value');
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(parts[0], 'base64');
  const tag = Buffer.from(parts[1], 'base64');
  const ct = Buffer.from(parts[2], 'base64');
  const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
  d.setAuthTag(tag);
  return d.update(ct).toString('utf8') + d.final('utf8');
}

// Use staging dump DB + its encryption key
const RESTORE_DSN = (process.env.DATABASE_URL ?? '').replace(/\/[^/?]+(\?|$)/, '/beest_restore$1');
const ENC_KEY = process.env.DB_ENCRYPTION_KEY_STAGING;
if (!ENC_KEY) throw new Error('DB_ENCRYPTION_KEY_STAGING not set');

async function fetchJoeFraudList() {
  const url = process.env.FRAUD_REVIEW_API_URL.replace(/\/+$/, '');
  const ev = process.env.FRAUD_REVIEW_EVENT_ID;
  const key = process.env.FRAUD_REVIEW_API_KEY;
  const res = await fetch(`${url}/events/${encodeURIComponent(ev)}/projects`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`joe.fraud list ${res.status}`);
  const body = await res.json();
  return body?.projects ?? [];
}

async function fetchAirtableRows() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = 'Projects';
  const all = [];
  let offset = '';
  while (true) {
    const u = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`);
    u.searchParams.set('pageSize', '100');
    u.searchParams.set('filterByFormula', 'NOT({Failed})');
    if (offset) u.searchParams.set('offset', offset);
    const res = await fetch(u, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!res.ok) throw new Error(`Airtable list ${res.status}: ${await res.text()}`);
    const body = await res.json();
    for (const r of body.records ?? []) all.push(r);
    if (!body.offset) break;
    offset = body.offset;
  }
  return all;
}

(async () => {
  const c = new Client({ connectionString: RESTORE_DSN });
  await c.connect();
  console.log(`Connected to ${RESTORE_DSN.replace(/:[^:@]+@/, ':***@')}`);

  console.log('Building email -> user map (decrypting)...');
  const allUsers = await c.query('SELECT id, email, slack_id, name FROM users');
  const emailToUser = new Map();
  let decryptFails = 0;
  for (const u of allUsers.rows) {
    if (!u.email) continue;
    try {
      const plain = decryptField(u.email, ENC_KEY).toLowerCase();
      emailToUser.set(plain, { id: u.id, slackId: u.slack_id, name: u.name, encryptedEmail: u.email });
    } catch { decryptFails += 1; }
  }
  console.log(`  decrypted ${emailToUser.size} emails; ${decryptFails} failed`);

  console.log('Fetching joe.fraud existing projects...');
  const joeList = await fetchJoeFraudList();
  const joeByOrg = new Map();
  for (const p of joeList) {
    if (p.organizerPlatformId) joeByOrg.set(p.organizerPlatformId, p);
  }
  console.log(`  joe.fraud has ${joeList.length} projects (${joeByOrg.size} with organizerPlatformId)`);

  console.log('Fetching Airtable Projects (failed != true)...');
  const atRows = await fetchAirtableRows();
  console.log(`  Airtable returned ${atRows.length} not-failed rows`);

  console.log('Matching to beest projects...');
  const matched = [];
  const unmatched = [];
  const skippedOnJoe = [];

  for (const r of atRows) {
    const f = r.fields ?? {};
    const email = f.Email;
    const codeUrl = f['Code URL'];
    if (!email || !codeUrl) {
      unmatched.push({ at_id: r.id, reason: 'no email/code_url' });
      continue;
    }
    const usr = emailToUser.get(email.toLowerCase());
    if (!usr) {
      unmatched.push({ at_id: r.id, email, codeUrl, reason: 'no beest user with that decrypted email' });
      continue;
    }
    const q = `
      SELECT id, name, code_url, demo_url, hackatime_project_name,
             project_type, status, created_at, user_id
      FROM projects
      WHERE user_id = $1 AND code_url = $2
      ORDER BY created_at ASC
    `;
    const beest = await c.query(q, [usr.id, codeUrl]);
    // Decorate rows with user info for downstream use
    for (const row of beest.rows) {
      row.email = email; // already lowercased-known plain
      row.slack_id = usr.slackId;
      row.user_name = usr.name;
    }
    if (beest.rows.length === 0) {
      unmatched.push({ at_id: r.id, email, codeUrl, reason: 'no beest project with that email+code_url' });
      continue;
    }
    // Pick the project whose created_at is closest to the Airtable created_time
    // (handles users who re-submit the same repo).
    const atCreated = new Date(r.createdTime).getTime();
    let best = beest.rows[0];
    let bestDiff = Math.abs(new Date(best.created_at).getTime() - atCreated);
    for (const cand of beest.rows.slice(1)) {
      const d = Math.abs(new Date(cand.created_at).getTime() - atCreated);
      if (d < bestDiff) { best = cand; bestDiff = d; }
    }

    if (joeByOrg.has(best.id)) {
      skippedOnJoe.push({ at_id: r.id, beest_id: best.id, name: best.name });
      continue;
    }

    matched.push({
      at_id: r.id,
      at_fields: f,
      beest: best,
    });
  }

  // Number projects per-user by creation order (for the override name)
  const userOrder = new Map(); // userId -> [matched...]
  for (const m of matched) {
    const arr = userOrder.get(m.beest.user_id) ?? [];
    arr.push(m);
    userOrder.set(m.beest.user_id, arr);
  }
  for (const arr of userOrder.values()) {
    arr.sort((a, b) => new Date(a.beest.created_at) - new Date(b.beest.created_at));
    arr.forEach((m, i) => { m.userProjectN = i + 1; });
  }

  // Build payloads
  const payloads = matched.map((m) => {
    const f = m.at_fields;
    const firstName = (f['First Name'] ?? '').trim() ||
                      (m.beest.user_name ?? '').trim().split(/\s+/)[0] || '';
    const lastName = (f['Last Name'] ?? '').trim() ||
                     (m.beest.user_name ?? '').trim().split(/\s+/).slice(1).join(' ') || '';
    const displayName = `Beest - ${firstName} ${lastName} project ${m.userProjectN}`.replace(/\s+/g, ' ').trim();

    // hackatime_project_name is JSON-encoded array; decode safely
    let hackatimeProjects = [];
    const raw = m.beest.hackatime_project_name;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        hackatimeProjects = Array.isArray(parsed) ? parsed : [raw];
      } catch { hackatimeProjects = [raw]; }
    }

    const submitter = m.beest.slack_id ? { slackId: m.beest.slack_id } : { email: m.beest.email };
    const isHardware = m.beest.project_type === 'hardware';

    const body = {
      name: displayName,
      codeLink: m.beest.code_url ?? '',
      submitter,
      organizerPlatformId: m.beest.id,
    };
    if (m.beest.demo_url) body.demoLink = m.beest.demo_url;
    if (isHardware) {
      body.isHardware = true;
      // Note: hardwareJournal building is non-trivial (needs devlogs + hackatime spans).
      // For backfill dry-run we flag hardware projects for manual review.
      body.hardwareJournal = '__HARDWARE_NEEDS_JOURNAL__';
    } else if (hackatimeProjects.length > 0) {
      body.hackatimeProjects = hackatimeProjects;
    }
    return { at_id: m.at_id, beest_id: m.beest.id, status: m.beest.status, body };
  });

  console.log('\n=== Summary ===');
  console.log(`Matched & ready to POST: ${payloads.length}`);
  console.log(`Already on joe.fraud (skipped): ${skippedOnJoe.length}`);
  console.log(`Unmatched (no beest project): ${unmatched.length}`);

  const byStatus = {};
  for (const p of payloads) byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
  console.log('Beest project status breakdown of payloads:', byStatus);

  const hwCount = payloads.filter(p => p.body.hardwareJournal).length;
  const noHackatime = payloads.filter(p => !p.body.isHardware && !p.body.hackatimeProjects).length;
  const submitterByEmail = payloads.filter(p => p.body.submitter.email).length;
  console.log(`Hardware (needs journal): ${hwCount}`);
  console.log(`Non-hardware w/ NO hackatime: ${noHackatime}`);
  console.log(`Submitter via email (no slackId): ${submitterByEmail}`);

  console.log('\n=== First 5 payloads ===');
  for (const p of payloads.slice(0, 5)) console.log(JSON.stringify(p, null, 2));

  if (unmatched.length > 0) {
    console.log('\n=== Unmatched (first 10) ===');
    for (const u of unmatched.slice(0, 10)) console.log(JSON.stringify(u));
  }

  // Write payloads to file so we can POST in a second step
  require('fs').writeFileSync(
    'fraud-backfill-payloads.json',
    JSON.stringify(payloads, null, 2),
  );
  console.log('\nWrote fraud-backfill-payloads.json');

  await c.end();
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
