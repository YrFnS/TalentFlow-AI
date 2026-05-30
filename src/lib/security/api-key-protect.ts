import { encrypt, decrypt, isEncrypted } from './encryption';

// Encrypt an API key before storing
export function encryptApiKey(apiKey: string): string {
  return encrypt(apiKey);
}

// Decrypt an API key after retrieval
export function decryptApiKey(encryptedKey: string): string {
  // Handle already-encrypted keys
  if (isEncrypted(encryptedKey)) {
    try {
      return decrypt(encryptedKey);
    } catch {
      // If decryption fails, the key might be stored in plaintext
      console.warn('Failed to decrypt API key, returning as-is');
      return encryptedKey;
    }
  }
  // Plaintext key (legacy support)
  return encryptedKey;
}
