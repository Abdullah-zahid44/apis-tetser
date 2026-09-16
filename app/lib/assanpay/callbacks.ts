import crypto from 'node:crypto';

export type CallbackVerificationResult = {
  valid: boolean;
  message: string;
  eventId: string;
  timestamp: string;
  receivedSignature: string;
  generatedSignature: string;
  payload: unknown;
};

/**
 * Verifies an incoming AssanPay callback webhook using the exact raw body string.
 *
 * Headers expected:
 * - X-Assanpay-Event-Id
 * - X-Assanpay-Timestamp
 * - X-Assanpay-Signature
 *
 * Canonical String:
 * `${eventId}\n${timestamp}\n${rawBody}`
 */
export function verifyCallbackSignature(
  rawBody: string,
  headers: Headers | Record<string, string | null | undefined>,
  apiSecret: string
): CallbackVerificationResult {
  const getHeader = (name: string): string => {
    if (headers instanceof Headers) {
      return headers.get(name) || '';
    }
    const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
    return key ? headers[key] || '' : '';
  };

  const eventId = getHeader('X-Assanpay-Event-Id');
  const timestamp = getHeader('X-Assanpay-Timestamp');
  const receivedSignature = getHeader('X-Assanpay-Signature');

  if (!eventId || !timestamp || !receivedSignature) {
    return {
      valid: false,
      message: 'Missing required callback signature headers (X-Assanpay-Event-Id, X-Assanpay-Timestamp, or X-Assanpay-Signature).',
      eventId,
      timestamp,
      receivedSignature,
      generatedSignature: '',
      payload: tryParseJson(rawBody),
    };
  }

  if (!apiSecret) {
    return {
      valid: false,
      message: 'API Secret is not configured for this market environment.',
      eventId,
      timestamp,
      receivedSignature,
      generatedSignature: '',
      payload: tryParseJson(rawBody),
    };
  }

  // Canonical string as specified in manual: `${eventId}\n${timestamp}\n${rawBody}`
  const canonical = `${eventId}\n${timestamp}\n${rawBody}`;

  const generatedSignature = crypto
    .createHmac('sha256', apiSecret)
    .update(canonical, 'utf8')
    .digest('base64');

  // Constant-time signature comparison to prevent timing attacks
  let valid = false;
  try {
    const receivedBuf = Buffer.from(receivedSignature);
    const generatedBuf = Buffer.from(generatedSignature);
    if (receivedBuf.length === generatedBuf.length) {
      valid = crypto.timingSafeEqual(receivedBuf, generatedBuf);
    }
  } catch {
    valid = false;
  }

  return {
    valid,
    message: valid ? 'Callback signature verified successfully.' : 'Signature mismatch. Payload may have been tampered or signed with different secret.',
    eventId,
    timestamp,
    receivedSignature,
    generatedSignature,
    payload: tryParseJson(rawBody),
  };
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
