export type EnvironmentName = 'sandbox';

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
  callbackSecretConfigured: boolean;
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
  if (normEnv && !['SANDBOX', 'DEFAULT', 'GATEWAY'].includes(normEnv)) return {};

  const baseUrl =
    process.env[`ASSANPAY_${normCountry}_BASE_URL`] ||
    process.env[`ASSANPAY_${normCountry}_SANDBOX_BASE_URL`];
  const apiKey =
    process.env[`ASSANPAY_${normCountry}_API_KEY`] ||
    process.env[`ASSANPAY_${normCountry}_SANDBOX_API_KEY`];
  const apiSecret =
    process.env[`ASSANPAY_${normCountry}_API_SECRET`] ||
    process.env[`ASSANPAY_${normCountry}_SANDBOX_API_SECRET`];

  return { baseUrl, apiKey, apiSecret };
}

/** Main merchant secret is used only to verify incoming callback signatures. */
export function getAssanPayCallbackSecret(
  countrySlug: string,
  environment: string = 'sandbox'
): string | undefined {
  const normCountry = countrySlug.toUpperCase();
  const normEnv = environment.toUpperCase();
  if (normEnv && !['SANDBOX', 'DEFAULT', 'GATEWAY'].includes(normEnv)) return undefined;
  return (
    process.env[`ASSANPAY_${normCountry}_MAIN_API_SECRET`] ||
    process.env[`ASSANPAY_${normCountry}_SANDBOX_MAIN_API_SECRET`] ||
    undefined
  );
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
  const callbackSecret = getAssanPayCallbackSecret(countrySlug, environment);
  const callbackSecretConfigured = Boolean(callbackSecret && callbackSecret.trim().length > 0);
  const configured = baseUrlConfigured && apiKeyConfigured && apiSecretConfigured;

  return {
    configured,
    baseUrlConfigured,
    apiKeyConfigured,
    apiSecretConfigured,
    callbackSecretConfigured,
    hostname,
    encryptionMode: 'none', // Current version: Encryption OFF
  };
}
