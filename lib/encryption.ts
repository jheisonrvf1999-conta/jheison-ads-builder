import CryptoJS from 'crypto-js'

function getKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters')
  }
  return key
}

export function encrypt(plaintext: string): string {
  return CryptoJS.AES.encrypt(plaintext, getKey()).toString()
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, getKey())
  return bytes.toString(CryptoJS.enc.Utf8)
}

export function encryptToken(token: string): string {
  return encrypt(token)
}

export function decryptToken(encryptedToken: string): string {
  try {
    return decrypt(encryptedToken)
  } catch {
    throw new Error('Failed to decrypt token — key mismatch or corrupted data')
  }
}
