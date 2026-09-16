export type EnvironmentName = 'sandbox' | 'production' | 'staging';

export type AssanPayCredentials = {
  baseUrl?: string;
  apiKey?: string;
  apiSecret?: string;
};

export type SafeEnvironmentReadiness = {
  configured: boolean;
  baseUrlConfigured: boolean;
  apiKeyConfigured: boolean;
  apiSecretConfigured: boolean;
  hostname?: string;
  encryptionMode: 'none' | 'request' | 'response' | 'both';
};

/**
 * Resolves credentials server-side from environment variables.
 * Never leaks to the client.
 */
export function getAssanPayCredentials(
  countrySlug: string,
  environment: string = 'sandbox'
): AssanPayCredentials {
  const normCountry = countrySlug.toUpperCase();
  const normEnv = environment.toUpperCase();
  const allowLegacyFallback = normEnv === 'PRODUCTION';

  // Try environment-specific naming first: ASSANPAY_{COUNTRY}_{ENV}_*
  const baseUrl =
    process.env[`ASSANPAY_${normCountry}_${normEnv}_BASE_URL`] ||
    (allowLegacyFallback ? process.env[`ASSANPAY_${normCountry}_BASE_URL`] : undefined) ||
    (allowLegacyFallback && normCountry === 'BDT' ? process.env.ASSANPAY_BASE_URL : undefined);

  const apiKey =
    process.env[`ASSANPAY_${normCountry}_${normEnv}_API_KEY`] ||
    (allowLegacyFallback ? process.env[`ASSANPAY_${normCountry}_API_KEY`] : undefined) ||
    (allowLegacyFallback && normCountry === 'BDT' ? process.env.ASSANPAY_API_KEY : undefined);

  const apiSecret =
    process.env[`ASSANPAY_${normCountry}_${normEnv}_API_SECRET`] ||
    (allowLegacyFallback ? process.env[`ASSANPAY_${normCountry}_API_SECRET`] : undefined) ||
    (allowLegacyFallback && normCountry === 'BDT' ? process.env.ASSANPAY_API_SECRET : undefined);

  return { baseUrl, apiKey, apiSecret };
}

/**
 * Returns safe boolean readiness info for frontend consumption.
 * Secret values are NEVER returned.
 */
export function getSafeEnvironmentReadiness(
  countrySlug: string,
  environment: string = 'sandbox'
): SafeEnvironmentReadiness {
  const creds = getAssanPayCredentials(countrySlug, environment);

  let hostname = '';
  if (creds.baseUrl) {
    try {
      hostname = new URL(creds.baseUrl).hostname;
    } catch {
      hostname = '';
    }
  }

  const baseUrlConfigured = Boolean(creds.baseUrl && creds.baseUrl.trim().length > 0);
  const apiKeyConfigured = Boolean(creds.apiKey && creds.apiKey.trim().length > 0);
  const apiSecretConfigured = Boolean(creds.apiSecret && creds.apiSecret.trim().length > 0);
  const configured = baseUrlConfigured && apiKeyConfigured && apiSecretConfigured;

  return {
    configured,
    baseUrlConfigured,
    apiKeyConfigured,
    apiSecretConfigured,
    hostname,
    encryptionMode: 'none', // Current version: Encryption OFF
  };
}
