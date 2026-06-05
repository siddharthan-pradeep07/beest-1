export function formatLocal(date?: string | number | Date, opts?: Intl.DateTimeFormatOptions) {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) return '—';
    const defaultOpts: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    };
    return new Intl.DateTimeFormat(undefined, { ...defaultOpts, ...(opts ?? {}) }).format(d);
  } catch (e) {
    return '—';
  }
}
