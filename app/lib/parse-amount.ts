/**
 * parse-amount — extract a numeric amount from a history row's requestBody.
 *
 * The requestBody is stored as a JSON string. The amount may live under
 * `amount`, `Amount`, or `AMOUNT` (checked in that order), either as a
 * number or a numeric string.
 *
 * Returns the numeric value, or null when the body is not JSON, the keys
 * are absent, or the value is not numeric.
 */
export function parseAmount(
  requestBody: string | null | undefined
): number | null {
  if (!requestBody) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(requestBody);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return null;
  }

  const record = parsed as Record<string, unknown>;
  for (const key of ['amount', 'Amount', 'AMOUNT']) {
    if (!(key in record)) continue;
    const value = record[key];
    if (typeof value === 'number') {
      if (Number.isFinite(value)) return value;
      continue;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) continue;
      const num = Number(trimmed);
      if (Number.isFinite(num)) return num;
    }
  }
  return null;
}

/**
 * Human-friendly amount for display: the parsed number grouped by
 * thousands (e.g. 12,500), or '—' when no amount could be parsed.
 */
export function formatAmount(
  requestBody: string | null | undefined
): string {
  const value = parseAmount(requestBody);
  return value === null ? '—' : value.toLocaleString('en-US');
}
