import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a 256-bit key from ENV_VAULT_KEY or returns null if not configured.
 */
function getVaultKey(): Buffer | null {
  const secret = process.env.ENV_VAULT_KEY || process.env.AUTH_SECRET;
  if (!secret) return null;
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a sensitive string using AES-256-GCM.
 * Output format: base64(iv + authTag + ciphertext)
 */
export function encryptSecret(plainText: string): string {
  const key = getVaultKey();
  if (!key) {
    // If no vault key is configured, return base64 encoded string as fallback
    return Buffer.from(plainText, 'utf8').toString('base64');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64');
}

/**
 * Decrypts a sensitive string previously encrypted with encryptSecret.
 */
export function decryptSecret(encryptedBase64: string): string {
  if (!encryptedBase64) return '';

  const key = getVaultKey();
  if (!key) {
    try {
      return Buffer.from(encryptedBase64, 'base64').toString('utf8');
    } catch {
      return encryptedBase64;
    }
  }

  try {
    const data = Buffer.from(encryptedBase64, 'base64');
    if (data.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      return Buffer.from(encryptedBase64, 'base64').toString('utf8');
    }

    const iv = data.subarray(0, IV_LENGTH);
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.warn('[VAULT] Could not decrypt vault secret, returning as-is:', err);
    return encryptedBase64;
  }
}
