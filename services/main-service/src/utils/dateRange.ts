export interface ResolvedRange {
  from: Date;
  to: Date;
}

/**
 * Powers the "Today / This Week / This Year / Custom" selector on the admin
 * analytics dashboard. `preset` takes priority; explicit from/to (ISO
 * strings) are used for the "Custom" option.
 */
export function resolveDateRange(query: { from?: string; to?: string; preset?: string }): ResolvedRange {
  const now = new Date();
  const to = query.to ? new Date(query.to) : now;

  if (query.preset === "today" || !query.preset) {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    return { from, to };
  }
  if (query.preset === "week") {
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    return { from, to };
  }
  if (query.preset === "month") {
    const from = new Date(now);
    from.setMonth(from.getMonth() - 1);
    return { from, to };
  }
  if (query.preset === "year") {
    const from = new Date(now);
    from.setFullYear(from.getFullYear() - 1);
    return { from, to };
  }

  // custom
  return {
    from: query.from ? new Date(query.from) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    to,
  };
}

/** Buckets a list of {createdAt} rows into day-by-day counts across the range — used for line/bar charts. */
export function bucketByDay<T extends { createdAt: Date }>(rows: T[], from: Date, to: Date) {
  const buckets: Record<string, number> = {};
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= to) {
    buckets[cursor.toISOString().slice(0, 10)] = 0;
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    if (key in buckets) buckets[key] += 1;
  }

  return Object.entries(buckets).map(([date, count]) => ({ date, count }));
}
