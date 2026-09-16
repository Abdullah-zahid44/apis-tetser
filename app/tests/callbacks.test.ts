import { verifyCallbackSignature } from '../lib/assanpay/callbacks';
import crypto from 'node:crypto';

export function runCallbackTests(): { passed: boolean; message: string }[] {
  const results = [];
  const apiSecret = 'test_webhook_secret_9988';
  const eventId = 'evt_20260427182019';
  const timestamp = '1712345678';
  const rawBody = '{"rail":"MW","type":"payin","amount":1,"status":"SUCCESS","orderId":"ORD1999"}';

  // Generate valid signature using official formula: Base64(HMAC-SHA256(`${eventId}\n${timestamp}\n${rawBody}`, secret))
  const canonical = `${eventId}\n${timestamp}\n${rawBody}`;
  const validSignature = crypto
    .createHmac('sha256', apiSecret)
    .update(canonical)
    .digest('base64');

  const validHeaders = {
    'X-Assanpay-Event-Id': eventId,
    'X-Assanpay-Timestamp': timestamp,
    'X-Assanpay-Signature': validSignature,
  };

  // 1. Valid signature accepted
  const validRes = verifyCallbackSignature(rawBody, validHeaders, apiSecret);
  results.push({
    passed: validRes.valid === true,
    message: `Accepts genuinely signed webhook callback`,
  });

  // 2. Tampered / altered raw body rejected
  const alteredBody = '{"rail":"MW","type":"payin","amount":99999,"status":"SUCCESS","orderId":"ORD1999"}';
  const alteredRes = verifyCallbackSignature(alteredBody, validHeaders, apiSecret);
  results.push({
    passed: alteredRes.valid === false,
    message: `Rejects callback when raw body content has been altered`,
  });

  // 3. Invalid signature string rejected
  const badHeaders = {
    ...validHeaders,
    'X-Assanpay-Signature': 'invalid_signature_base64==',
  };
  const badRes = verifyCallbackSignature(rawBody, badHeaders, apiSecret);
  results.push({
    passed: badRes.valid === false,
    message: `Rejects signature mismatch`,
  });

  // 4. Missing required headers rejected
  const missingRes = verifyCallbackSignature(rawBody, {}, apiSecret);
  results.push({
    passed: missingRes.valid === false,
    message: `Rejects callback missing required headers`,
  });

  return results;
}
