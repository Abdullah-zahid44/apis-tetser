import crypto from 'node:crypto';

export type EncryptedPayload = {
  encrypted: true;
  alg: 'AES/GCM';
  iv: string;
  cipherText: string;
};

function deriveKey(label: 'assanpay:req' | 'assanpay:res', apiSecret: string): Buffer {
  return crypto.createHmac('sha256', apiSecret).update(label, 'utf8').digest();
}

function isEncryptedPayload(value: unknown): value is EncryptedPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    record.encrypted === true &&
    record.alg === 'AES/GCM' &&
    typeof record.iv === 'string' &&
    typeof record.cipherText === 'string'
  );
}

/** Encrypts the final JSON payload exactly as specified in the signed-request manual. */
export function encryptRequestPayload(
  payload: unknown,
  apiSecret: string,
  iv: Buffer = crypto.randomBytes(12)
): EncryptedPayload {
  if (iv.length !== 12) throw new Error('AES-GCM IV must be exactly 12 bytes.');

  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey('assanpay:req', apiSecret), iv);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const cipherTextWithTag = Buffer.concat([ciphertext, cipher.getAuthTag()]);

  return {
    encrypted: true,
    alg: 'AES/GCM',
    iv: iv.toString('base64url'),
    cipherText: cipherTextWithTag.toString('base64url'),
  };
}

/** Decrypts an encrypted response with the main merchant API secret. */
export function decryptResponsePayload(payload: unknown, mainApiSecret: string): unknown {
  if (!isEncryptedPayload(payload)) throw new Error('Response is not a valid encrypted AssanPay envelope.');

  const iv = Buffer.from(payload.iv, 'base64url');
  const cipherTextWithTag = Buffer.from(payload.cipherText, 'base64url');
  if (iv.length !== 12) throw new Error('Encrypted response IV must be exactly 12 bytes.');
  if (cipherTextWithTag.length <= 16) throw new Error('Encrypted response is missing ciphertext or auth tag.');

  const authTag = cipherTextWithTag.subarray(cipherTextWithTag.length - 16);
  const ciphertext = cipherTextWithTag.subarray(0, cipherTextWithTag.length - 16);
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    deriveKey('assanpay:res', mainApiSecret),
    iv
  );
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plaintext.toString('utf8')) as unknown;
}

export function isAssanPayEncryptedPayload(value: unknown): value is EncryptedPayload {
  return isEncryptedPayload(value);
}
