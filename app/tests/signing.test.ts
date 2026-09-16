import { generateRequestSignature } from '../lib/assanpay/signing';
import crypto from 'node:crypto';

export function runSigningTests(): { passed: boolean; message: string }[] {
  const results = [];

  // Example from AssanPay Signed Request Manual (Page 3)
  const method = 'POST';
  const pathWithQuery = '/v1/payments/create';
  const timestamp = '1712345678';
  const nonce = '550e8400-e29b-41d4-a716-446655440000';
  const rawBody = '{"amount":1000,"currency":"PKR"}';
  const apiSecret = 'your_api_secret';

  const output = generateRequestSignature({
    method,
    pathWithQuery,
    timestamp,
    nonce,
    rawBody,
    apiSecret,
  });

  // Verify body hash matches lowercase SHA256 hex
  const expectedBodyHash = crypto.createHash('sha256').update(rawBody).digest('hex');
  results.push({
    passed: output.bodyHash === expectedBodyHash,
    message: `Computes lowercase SHA256 body hash -> ${output.bodyHash}`,
  });

  // Verify canonical string matches specification: METHOD\nPATH\nTIMESTAMP\nNONCE\nBODY_HASH
  const expectedCanonical = `${method}\n${pathWithQuery}\n${timestamp}\n${nonce}\n${expectedBodyHash}`;
  results.push({
    passed: output.canonical === expectedCanonical,
    message: `Formats canonical string with correct newline delimiters`,
  });

  // Verify HMAC-SHA256 base64 signature
  const expectedSig = crypto
    .createHmac('sha256', apiSecret)
    .update(expectedCanonical)
    .digest('base64');
  results.push({
    passed: output.signature === expectedSig,
    message: `Generates valid Base64 HMAC-SHA256 signature -> ${output.signature}`,
  });

  // Verify empty body hashing (hashes empty string)
  const emptyBodyOutput = generateRequestSignature({
    method: 'GET',
    pathWithQuery: '/api/merchant/balance/h2h',
    timestamp: '1712345678',
    nonce: 'test-nonce',
    rawBody: '',
    apiSecret: 'secret',
  });
  const emptyHash = crypto.createHash('sha256').update('').digest('hex');
  results.push({
    passed: emptyBodyOutput.bodyHash === emptyHash,
    message: `Empty body hashes empty string correctly: ${emptyHash}`,
  });

  return results;
}
