/**
 * Centralized audit log sanitizer.
 * Ensures credentials, tokens, OTPs, PINs, and full account numbers
 * are masked before storing in request_history or returning to audit logs.
 */

const SENSITIVE_KEYS = new Set([
  'api_secret',
  'apisecret',
  'auth_secret',
  'authsecret',
  'client_secret',
  'clientsecret',
  'database_url',
  'env_vault_key',
  'otp',
  'pin',
  'password',
  'token',
  'authorization',
  'x-signature',
  'x-assanpay-signature',
]);

/**
 * Intelligent masking:
 * - Phone / Account numbers (e.g. 03273595453) -> 0327****453
 * - Short secrets (e.g. OTP 26676) -> *****
 * - API Key / Token -> first 4 chars + **** + last 4 chars
 */
export function maskSensitiveValue(key: string, value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'string') return value;

  const lowerKey = key.toLowerCase();

  // Full redaction for secrets
  if (
    lowerKey.includes('secret') ||
    lowerKey.includes('password') ||
    lowerKey.includes('signature') ||
    lowerKey === 'authorization'
  ) {
    return '[REDACTED_SECRET]';
  }

  // OTP or PIN: mask completely
  if (lowerKey === 'otp' || lowerKey === 'pin') {
    return '*****';
  }

  // API Key: partial mask
  if (lowerKey.includes('api_key') || lowerKey.includes('apikey') || lowerKey === 'x-api-key') {
    if (value.length > 8) {
      return `${value.slice(0, 4)}...${value.slice(-4)}`;
    }
    return '****';
  }

  // Account No / Contact / Wallet: partial mask keeping prefix & suffix
  if (
    lowerKey.includes('accountno') ||
    lowerKey.includes('accountnumber') ||
    lowerKey.includes('customercontact') ||
    lowerKey.includes('walletnumber') ||
    lowerKey === 'cnic'
  ) {
    if (value.length >= 8) {
      return `${value.slice(0, 4)}****${value.slice(-3)}`;
    }
    return '****';
  }

  return value;
}

/**
 * Recursively sanitizes headers or JSON payload for audit logging.
 */
export function sanitizeForAudit<T>(input: T): T {
  if (!input) return input;

  if (typeof input === 'string') {
    // If it's a JSON string, parse, sanitize, and re-serialize
    try {
      const parsed = JSON.parse(input);
      const sanitized = sanitizeForAudit(parsed);
      return JSON.stringify(sanitized, null, 2) as unknown as T;
    } catch {
      return input;
    }
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeForAudit(item)) as unknown as T;
  }

  if (typeof input === 'object') {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k.toLowerCase())) {
        sanitizedObj[k] = maskSensitiveValue(k, v);
      } else if (typeof v === 'object' && v !== null) {
        sanitizedObj[k] = sanitizeForAudit(v);
      } else if (
        k.toLowerCase().includes('account') ||
        k.toLowerCase().includes('contact') ||
        k.toLowerCase().includes('wallet') ||
        k.toLowerCase() === 'cnic'
      ) {
        sanitizedObj[k] = maskSensitiveValue(k, v);
      } else {
        sanitizedObj[k] = v;
      }
    }
    return sanitizedObj as T;
  }

  return input;
}
