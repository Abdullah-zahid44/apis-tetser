/** Fill only catalog templates; saved or manually edited requests stay untouched. */
export function withCallbackUrl(defaultBody: string, countrySlug: string, origin: string): string {
  if (!defaultBody) return defaultBody;

  try {
    const payload: unknown = JSON.parse(defaultBody);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return defaultBody;
    const record = payload as Record<string, unknown>;
    let changed = false;

    if (Object.prototype.hasOwnProperty.call(record, 'callbackUrl')) {
      record.callbackUrl = `${origin}/api/callbacks/assanpay/${countrySlug}`;
      changed = true;
    }

    const envBranch = process.env.ASSANPAY_BRANCH_CODE || process.env.NEXT_PUBLIC_ASSANPAY_BRANCH_CODE;
    if (envBranch && Object.prototype.hasOwnProperty.call(record, 'branchCode')) {
      record.branchCode = envBranch;
      changed = true;
    }

    return changed ? JSON.stringify(record, null, 2) : defaultBody;
  } catch {
    return defaultBody;
  }
}

export function callbackOrigin(requestUrl: string, configuredAppUrl?: string): string {
  if (configuredAppUrl) {
    try {
      const configured = new URL(configuredAppUrl);
      if (configured.protocol === 'https:') return configured.origin;
    } catch {
      // Fall through to the current request origin.
    }
  }
  return new URL(requestUrl).origin;
}
