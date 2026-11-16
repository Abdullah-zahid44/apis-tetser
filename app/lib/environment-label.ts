/**
 * Converts internal environment keys into user-facing product labels.
 * Keep persistence/API keys unchanged while avoiding technical terminology in UI.
 */
export function environmentLabel(value: string | null | undefined, compact = false): string {
  const normalized = value?.trim().toLowerCase();

  if (!normalized || normalized === 'sandbox' || normalized === 'gateway' || normalized === 'default') {
    return compact ? 'Test' : 'Test Environment';
  }

  if (normalized === 'all') return compact ? 'All' : 'All Environments';

  return normalized
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
