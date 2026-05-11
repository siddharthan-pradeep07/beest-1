/* eslint-disable */
// Reads fraud-backfill-payloads.json (produced by dryrun) and POSTs each to
// joe.fraud, logging successes/failures. Re-checks the live list right before
// posting and skips any organizerPlatformId already present, so re-running
// the script is idempotent.
const path = require('path');
const fs = require('fs');
const backendDir = path.join(__dirname, '..', 'backend');
require(path.join(backendDir, 'node_modules', 'dotenv')).config({
  path: path.join(backendDir, '.env'),
});

const PAYLOAD_FILE = path.join(__dirname, '..', 'fraud-backfill-payloads.json');
const RESULTS_FILE = path.join(__dirname, '..', 'fraud-backfill-results.json');
const DELAY_MS = 500;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const url = process.env.FRAUD_REVIEW_API_URL.replace(/\/+$/, '');
  const ev = process.env.FRAUD_REVIEW_EVENT_ID;
  const key = process.env.FRAUD_REVIEW_API_KEY;
  const headers = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
  const createUrl = `${url}/events/${encodeURIComponent(ev)}/projects`;

  // Re-fetch existing list so we don't double-create if the file is stale.
  const listRes = await fetch(createUrl, { headers });
  if (!listRes.ok) throw new Error(`list failed: ${listRes.status}`);
  const listBody = await listRes.json();
  const existing = new Set(
    (listBody.projects ?? [])
      .map((p) => p.organizerPlatformId)
      .filter(Boolean),
  );
  console.log(`joe.fraud already has ${existing.size} organizerPlatformIds`);

  const payloads = JSON.parse(fs.readFileSync(PAYLOAD_FILE, 'utf8'));
  const results = { ok: [], skipped: [], failed: [] };

  for (let i = 0; i < payloads.length; i += 1) {
    const p = payloads[i];
    const label = `[${i + 1}/${payloads.length}] ${p.body.name}`;
    if (existing.has(p.beest_id)) {
      console.log(`SKIP ${label} — already on joe.fraud`);
      results.skipped.push({ at_id: p.at_id, beest_id: p.beest_id, reason: 'already_exists' });
      continue;
    }
    if (p.body.hardwareJournal === '__HARDWARE_NEEDS_JOURNAL__') {
      console.log(`SKIP ${label} — hardware needs journal`);
      results.skipped.push({ at_id: p.at_id, beest_id: p.beest_id, reason: 'hardware_needs_journal' });
      continue;
    }
    try {
      const res = await fetch(createUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(p.body),
      });
      const respBody = await res.json().catch(() => null);
      if (!res.ok) {
        console.log(`FAIL ${label} — ${res.status} ${JSON.stringify(respBody)?.slice(0, 200)}`);
        results.failed.push({ at_id: p.at_id, beest_id: p.beest_id, status: res.status, body: respBody });
      } else {
        const remoteId = respBody?.id;
        console.log(`OK   ${label} -> ${remoteId}`);
        results.ok.push({ at_id: p.at_id, beest_id: p.beest_id, remote_id: remoteId });
        existing.add(p.beest_id);
      }
    } catch (e) {
      console.log(`ERR  ${label} — ${e.message}`);
      results.failed.push({ at_id: p.at_id, beest_id: p.beest_id, error: e.message });
    }
    await sleep(DELAY_MS);
  }

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
  console.log('\n=== Done ===');
  console.log(`OK:      ${results.ok.length}`);
  console.log(`Skipped: ${results.skipped.length}`);
  console.log(`Failed:  ${results.failed.length}`);
  console.log(`Results -> ${RESULTS_FILE}`);
})().catch((e) => { console.error('FATAL:', e); process.exit(1); });
