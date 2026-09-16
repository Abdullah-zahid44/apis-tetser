/** Fill only catalog templates; saved or manually edited requests stay untouched. */
export function withCallbackUrl(defaultBody: string, countrySlug: string, origin: string): string {
  if (!defaultBody) return defaultBody;

  try {
    const payload: unknown = JSON.parse(defaultBody);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return defaultBody;
    if (!Object.prototype.hasOwnProperty.call(payload, 'callbackUrl')) return defaultBody;

    return JSON.stringify({
      ...payload,
      callbackUrl: `${origin}/api/callbacks/assanpay/${countrySlug}/sandbox`,
    }, null, 2);
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
