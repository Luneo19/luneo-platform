export function normalizeListResponse<T>(input: unknown): T[] {
  if (Array.isArray(input)) return input as T[];
  if (!input || typeof input !== 'object') return [];

  const record = input as Record<string, unknown>;

  if (Array.isArray(record.data)) return record.data as T[];
  if (record.data && typeof record.data === 'object') {
    const nested = record.data as Record<string, unknown>;
    if (Array.isArray(nested.items)) return nested.items as T[];
    if (Array.isArray(nested.data)) return nested.data as T[];
  }

  if (Array.isArray(record.items)) return record.items as T[];
  if (Array.isArray(record.results)) return record.results as T[];
  return [];
}
