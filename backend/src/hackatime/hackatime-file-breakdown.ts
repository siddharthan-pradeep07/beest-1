import { fetchWithTimeout } from '../fetch.util';

export type FileHours = { file: string; hours: number };

const round1 = (n: number) => Math.round(n * 10) / 10;

export async function getFileHoursForProject(opts: {
  baseUrl: string;
  adminKey: string;
  hackatimeUserId: string | number;
  projectName: string;
  startDate: string;
  endDate: string;
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

  if (!res.ok) return [];

  const body = await res.json().catch(() => null);
  const spans: Array<{
    entity?: string;
    file?: string;
    path?: string;
    name?: string;
    duration?: number;
    start_time?: number;
    end_time?: number;
  }> = body?.spans ?? [];

  const totals = new Map<string, number>();

  for (const span of spans) {
    const file =
      typeof span.entity === 'string'
        ? span.entity
        : typeof span.file === 'string'
          ? span.file
          : typeof span.path === 'string'
            ? span.path
            : typeof span.name === 'string'
              ? span.name
              : null;

    if (!file) continue;

    let seconds = 0;
    if (typeof span.duration === 'number' && Number.isFinite(span.duration) && span.duration > 0) {
      seconds = span.duration;
    } else if (
      typeof span.start_time === 'number' &&
      typeof span.end_time === 'number' &&
      Number.isFinite(span.start_time) &&
      Number.isFinite(span.end_time) &&
      span.end_time > span.start_time
    ) {
      const diff = span.end_time - span.start_time;
      seconds = diff > 1e9 ? diff / 1000 : diff;
    }

    if (seconds <= 0) continue;
    totals.set(file, (totals.get(file) ?? 0) + seconds);
  }

  return [...totals.entries()]
    .map(([file, seconds]) => ({ file, hours: round1(seconds / 3600) }))
    .filter((row) => row.hours > 0)
    .sort((a, b) => b.hours - a.hours);
}
