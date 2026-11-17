import crypto from 'node:crypto';
import {
  decryptResponsePayload,
  encryptRequestPayload,
  type EncryptedPayload,
} from '../lib/assanpay/encryption';

function makeEncryptedResponse(payload: unknown, secret: string, iv: Buffer): EncryptedPayload {
  const key = crypto.createHmac('sha256', secret).update('assanpay:res').digest();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(JSON.stringify(payload), 'utf8')),
    cipher.final(),
  ]);
  return {
    encrypted: true,
    alg: 'AES/GCM',
    iv: iv.toString('base64url'),
    cipherText: Buffer.concat([ciphertext, cipher.getAuthTag()]).toString('base64url'),
  };
}

export function runEncryptionTests(): { passed: boolean; message: string }[] {
  const results = [];
  const secret = 'branch-secret';
  const payload = { orderId: 'ORD1001', amount: 10, currency: 'PKR' };
  const iv = Buffer.from('000102030405060708090a0b', 'hex');
  const encrypted = encryptRequestPayload(payload, secret, iv);

  const requestKey = crypto.createHmac('sha256', secret).update('assanpay:req').digest();
  const requestBytes = Buffer.from(encrypted.cipherText, 'base64url');
  const decipher = crypto.createDecipheriv('aes-256-gcm', requestKey, Buffer.from(encrypted.iv, 'base64url'));
  decipher.setAuthTag(requestBytes.subarray(requestBytes.length - 16));
  const decryptedRequest = JSON.parse(
    Buffer.concat([
      decipher.update(requestBytes.subarray(0, requestBytes.length - 16)),
      decipher.final(),
    ]).toString('utf8')
  );

  results.push({
    passed: JSON.stringify(decryptedRequest) === JSON.stringify(payload),
    message: 'Encrypts request JSON with the assanpay:req AES-256-GCM key derivation',
  });
  results.push({
    passed: !/[+/=]/.test(encrypted.iv + encrypted.cipherText),
    message: 'Encodes IV and ciphertext as unpadded Base64 URL-safe values',
  });

  const mainSecret = 'main-merchant-secret';
  const responsePayload = { success: true, status: 'SUCCESS' };
  const responseEnvelope = makeEncryptedResponse(responsePayload, mainSecret, iv);
  results.push({
    passed:
      JSON.stringify(decryptResponsePayload(responseEnvelope, mainSecret)) ===
      JSON.stringify(responsePayload),
    message: 'Decrypts responses with the main-secret assanpay:res key derivation',
  });

  const tampered = { ...responseEnvelope, cipherText: responseEnvelope.cipherText.slice(0, -1) + 'A' };
  let rejectedTampering = false;
  try {
    decryptResponsePayload(tampered, mainSecret);
  } catch {
    rejectedTampering = true;
  }
  results.push({
    passed: rejectedTampering,
    message: 'Rejects encrypted responses whose GCM authentication tag does not verify',
  });

  return results;
}
