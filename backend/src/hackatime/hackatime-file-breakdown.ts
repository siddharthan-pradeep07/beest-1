import { fetchWithTimeout } from '../fetch.util';

export type FileHours = { file: string; hours: number };

type Span = {
  entity?: string;
  file?: string;
  path?: string;
  name?: string;
  duration?: number;
  start_time?: number;
  end_time?: number;
};

type HeartbeatRow = {
  time?: number;
  entity?: string;
  file?: string;
  path?: string;
  name?: string;
  project?: string | null;
};

const round1 = (n: number) => Math.round(n * 10) / 10;
const HEARTBEAT_TIMEOUT_SECONDS = 120;
const PAGE_SIZE = 5000;

function getLabel(row: Pick<Span, 'entity' | 'file' | 'path' | 'name'>): string {
  return (
    (typeof row.entity === 'string' && row.entity.trim()) ||
    (typeof row.file === 'string' && row.file.trim()) ||
    (typeof row.path === 'string' && row.path.trim()) ||
    (typeof row.name === 'string' && row.name.trim()) ||
    ''
  );
}

function normalizeEpochSeconds(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed > 1e12 ? Math.floor(parsed / 1000) : Math.floor(parsed);
}

function normalizeProjectName(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

async function fetchSpans(opts: {
  baseUrl: string;
  adminKey: string;
  hackatimeUserId: string | number;
  projectName: string;
  startDate: string;
  endDate: string;
  debugLog?: (message: string) => void;
}): Promise<FileHours[]> {
  const params = new URLSearchParams({
    start_date: opts.startDate,
    end_date: opts.endDate,
    project: opts.projectName,
  });

  const res = await fetchWithTimeout(
    `${opts.baseUrl}/api/v1/users/${encodeURIComponent(String(opts.hackatimeUserId))}/heartbeats/spans?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${opts.adminKey}`,
      },
    },
  );

  if (!res.ok) {
    opts.debugLog?.(
      `[Hackatime file breakdown] project="${opts.projectName}" spans request failed status=${res.status}`,
    );
    return [];
  }

  const body = await res.json().catch(() => null);
  const spans: Span[] = Array.isArray(body?.spans)
    ? body.spans
    : Array.isArray(body?.data)
      ? body.data
      : Array.isArray(body?.items)
        ? body.items
        : Array.isArray(body)
          ? body
          : [];

  if (spans.length === 0) {
    opts.debugLog?.(
      `[Hackatime file breakdown] project="${opts.projectName}" spans endpoint returned no spans`,
    );
    return [];
  }

  const totals = new Map<string, number>();
  for (const span of spans) {
    const label = getLabel(span);
    if (!label) continue;

    let seconds = 0;
    if (typeof span.duration === 'number' && Number.isFinite(span.duration) && span.duration > 0) {
      seconds = span.duration;
    } else {
      const start = normalizeEpochSeconds(span.start_time);
      const end = normalizeEpochSeconds(span.end_time);
      if (start !== null && end !== null && end > start) {
        seconds = end - start;
      }
    }

    if (seconds <= 0) continue;
    totals.set(label, (totals.get(label) ?? 0) + seconds);
  }

  if (totals.size === 0) {
    opts.debugLog?.(
      `[Hackatime file breakdown] project="${opts.projectName}" spans had no file-like labels`,
    );
    return [];
  }

  opts.debugLog?.(
    `[Hackatime file breakdown] project="${opts.projectName}" used spans with ${totals.size} file buckets`,
  );

  return [...totals.entries()]
    .map(([file, seconds]) => ({ file, hours: round1(seconds / 3600) }))
    .filter((row) => row.hours > 0)
    .sort((a, b) => b.hours - a.hours);
}

async function fetchAdminHeartbeats(opts: {
  baseUrl: string;
  adminKey: string;
  hackatimeUserId: string | number;
  projectName: string;
  startDate: string;
  endDate: string;
  debugLog?: (message: string) => void;
}): Promise<HeartbeatRow[]> {
  const rows: HeartbeatRow[] = [];
  let offset = 0;

  while (true) {
    const params = new URLSearchParams({
      user_id: String(opts.hackatimeUserId),
      project: opts.projectName,
      start_date: opts.startDate,
      end_date: opts.endDate,
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });

    const res = await fetchWithTimeout(
      `${opts.baseUrl}/api/admin/v1/user/heartbeats?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${opts.adminKey}`,
        },
      },
    );

    if (!res.ok) {
      opts.debugLog?.(
        `[Hackatime file breakdown] project="${opts.projectName}" heartbeat fallback failed status=${res.status}`,
      );
      return [];
    }

    const body = await res.json().catch(() => null);
    const page: HeartbeatRow[] = Array.isArray(body?.heartbeats) ? body.heartbeats : [];
    rows.push(...page);

    const totalCount = Number(body?.total_count ?? page.length);
    const hasMore = body?.has_more === true;
    offset += page.length;
    if (!hasMore || page.length === 0 || offset >= totalCount) break;
  }

  opts.debugLog?.(
    `[Hackatime file breakdown] project="${opts.projectName}" fallback heartbeats=${rows.length} window=${opts.startDate}..${opts.endDate}`,
  );

  return rows;
}

function toFileHoursFromHeartbeats(rows: HeartbeatRow[]): FileHours[] {
  const sorted = rows
    .map((row) => ({
      time: normalizeEpochSeconds(row.time) ?? 0,
      label: getLabel(row),
    }))
    .filter((row) => row.time > 0)
    .sort((a, b) => a.time - b.time);

  const totals = new Map<string, number>();
  let lastTime: number | null = null;

  for (const row of sorted) {
    if (lastTime !== null && row.time > lastTime && row.label) {
      const diff = Math.min(row.time - lastTime, HEARTBEAT_TIMEOUT_SECONDS);
      if (diff > 0) {
        totals.set(row.label, (totals.get(row.label) ?? 0) + diff);
      }
    }
    lastTime = row.time;
  }

  if (totals.size === 0) {
    return [];
  }

  return [...totals.entries()]
    .map(([file, seconds]) => ({ file, hours: round1(seconds / 3600) }))
    .filter((row) => row.hours > 0)
    .sort((a, b) => b.hours - a.hours);
}

export async function getFileHoursForProject(opts: {
  baseUrl: string;
  adminKey: string;
  hackatimeUserId: string | number;
  projectName: string;
  startDate: string;
  endDate: string;
  debugLog?: (message: string) => void;
}): Promise<FileHours[]> {
  const spans = await fetchSpans(opts);
  if (spans.length > 0) return spans;

  const heartbeats = await fetchAdminHeartbeats(opts);
  if (heartbeats.length === 0) {
    opts.debugLog?.(
      `[Hackatime file breakdown] project="${opts.projectName}" no heartbeats available for fallback`,
    );
    return [];
  }

  const targetProject = normalizeProjectName(opts.projectName);
  const scopedHeartbeats = heartbeats.filter((row) => {
    const rowProject = normalizeProjectName(row.project);
    return !rowProject || rowProject === targetProject;
  });

  if (scopedHeartbeats.length !== heartbeats.length) {
    opts.debugLog?.(
      `[Hackatime file breakdown] project="${opts.projectName}" filtered ${heartbeats.length - scopedHeartbeats.length} fallback heartbeats from other projects`,
    );
  }

  const fileHours = toFileHoursFromHeartbeats(scopedHeartbeats);
  if (fileHours.length === 0) {
    opts.debugLog?.(
      `[Hackatime file breakdown] project="${opts.projectName}" fallback heartbeats had no file-level rows`,
    );
    return [];
  }

  opts.debugLog?.(
    `[Hackatime file breakdown] project="${opts.projectName}" fallback produced ${fileHours.length} file rows`,
  );

  return fileHours;
}