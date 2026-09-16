import { validateAssanPayUrl } from '../lib/security/ssrf';
import { sanitizeForAudit, maskSensitiveValue } from '../lib/security/audit-sanitizer';

export function runSecurityTests(): { passed: boolean; message: string }[] {
  const results = [];
  const trustedGateway = 'https://api-pk.assanpay.com';

  // 1. Valid URL on trusted gateway
  const validCheck = validateAssanPayUrl('/api/payments', trustedGateway);
  results.push({
    passed: validCheck.valid === true && validCheck.finalUrl?.pathname === '/api/payments',
    message: `Allows legitimate API path on trusted gateway origin`,
  });

  // 2. Reject arbitrary external domain
  const externalCheck = validateAssanPayUrl('https://evil.attacker.com/api/steal', trustedGateway);
  results.push({
    passed: externalCheck.valid === false,
    message: `Rejects arbitrary external domain: ${externalCheck.error}`,
  });

  // 3. Reject localhost and 127.0.0.1
  const localhostCheck = validateAssanPayUrl('http://localhost:8080/api/internal', trustedGateway);
  results.push({
    passed: localhostCheck.valid === false,
    message: `Rejects localhost SSRF attempt: ${localhostCheck.error}`,
  });

  const loopbackCheck = validateAssanPayUrl('http://127.0.0.1/api/internal', trustedGateway);
  results.push({
    passed: loopbackCheck.valid === false,
    message: `Rejects loopback 127.0.0.1 SSRF attempt: ${loopbackCheck.error}`,
  });

  // 4. Reject AWS/GCP cloud metadata IP
  const metadataCheck = validateAssanPayUrl('http://169.254.169.254/api/meta', trustedGateway);
  results.push({
    passed: metadataCheck.valid === false,
    message: `Rejects cloud metadata service (169.254.169.254): ${metadataCheck.error}`,
  });

  // 5. Audit Sanitization tests
  const maskedOtp = maskSensitiveValue('otp', '26676');
  results.push({
    passed: maskedOtp === '*****',
    message: `Masks OTP completely: 26676 -> ${maskedOtp}`,
  });

  const maskedPhone = maskSensitiveValue('customerContact', '03273595453');
  results.push({
    passed: maskedPhone === '0327****453',
    message: `Masks phone retaining prefix/suffix: 03273595453 -> ${maskedPhone}`,
  });

  const sanitized = sanitizeForAudit({
    apiKey: 'pk_live_1234567890abcdef',
    otp: '99881',
    password: 'secretPassword123',
    customerContact: '03001234567',
    orderId: 'ORD-100',
  });

  results.push({
    passed:
      sanitized.orderId === 'ORD-100' &&
      sanitized.otp === '*****' &&
      sanitized.password === '[REDACTED_SECRET]',
    message: `Sanitizes audit payload preserving non-sensitive debug fields`,
  });

  return results;
}
