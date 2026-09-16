import crypto from 'node:crypto';

export type SigningInput = {
  method: string;
  pathWithQuery: string;
  timestamp: string;
  nonce: string;
  rawBody: string;
  apiSecret: string;
};

export type SigningOutput = {
  signature: string;
  canonical: string;
  bodyHash: string;
};

/**
 * Generates an HMAC-SHA256 request signature according to official AssanPay documentation.
 *
 * Canonical String Format:
 * `${METHOD}\n${PATH_WITH_QUERY}\n${TIMESTAMP}\n${NONCE}\n${BODY_HASH}`
 *
 * Where:
 * - METHOD is uppercase (GET, POST)
 * - PATH_WITH_QUERY includes query string if present (e.g. /api/merchant/balance/h2h?mode=P2C)
 * - TIMESTAMP is Unix timestamp in seconds
 * - NONCE is a unique string (e.g. UUID v4)
 * - BODY_HASH is lowercase hex of SHA256(rawBody || '')
 */
export function generateRequestSignature(input: SigningInput): SigningOutput {
  const { method, pathWithQuery, timestamp, nonce, rawBody, apiSecret } = input;
  const bodyString = rawBody || '';

  // Step 1: Body hash (lowercase SHA256 hex)
  const bodyHash = crypto.createHash('sha256').update(bodyString, 'utf8').digest('hex');

  // Step 2: Canonical string
  const canonical = `${method.toUpperCase()}\n${pathWithQuery}\n${timestamp}\n${nonce}\n${bodyHash}`;

  // Step 3: HMAC-SHA256 signature encoded in Base64
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(canonical, 'utf8')
    .digest('base64');

  return { signature, canonical, bodyHash };
}
