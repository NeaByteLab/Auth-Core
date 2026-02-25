/**
 * Two-way AES-GCM encrypt and decrypt.
 * @description Symmetric cipher; secret shared between parties.
 */
export class Cipher {
  /** Static-only class; prevents instantiation */
  private constructor() {}
  /** IV length in bytes for AES-GCM */
  static readonly ivByteLength = 12
  /** Derived key length in bits */
  static readonly keyBitLength = 256
  /** PBKDF2 iteration count for key derivation */
  static readonly pbkdf2IterationCount = 100_000
  /** Salt length in bytes for PBKDF2 */
  static readonly saltByteLength = 16

  /**
   * Decrypt ciphertext from encrypt().
   * @description Requires same shared secret as encrypt.
   * @param encryptedBase64Url - Output from encrypt()
   * @param secret - Shared secret used to encrypt
   * @returns Plaintext or null when invalid or corrupted
   */
  static async decrypt(encryptedBase64Url: string, secret: string): Promise<string | null> {
    const combinedBytes = Cipher.base64UrlToBytes(encryptedBase64Url)
    const minLength = Cipher.saltByteLength + Cipher.ivByteLength + 16
    if (combinedBytes === null || combinedBytes.length < minLength) {
      return null
    }
    const saltBytes = combinedBytes.slice(0, Cipher.saltByteLength)
    const ivBytes = combinedBytes.slice(
      Cipher.saltByteLength,
      Cipher.saltByteLength + Cipher.ivByteLength
    )
    const encryptedBytes = combinedBytes.slice(Cipher.saltByteLength + Cipher.ivByteLength)
    const derivedKey = await Cipher.deriveKey(secret, saltBytes)
    try {
      const decryptedBytes = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBytes, tagLength: 128 },
        derivedKey,
        encryptedBytes
      )
      return new TextDecoder().decode(decryptedBytes)
    } catch {
      return null
    }
  }

  /**
   * Encrypt plaintext to base64url payload.
   * @description AES-256-GCM with random salt and IV per call.
   * @param plaintext - String to encrypt
   * @param secret - Shared secret (e.g. API key)
   * @returns Base64url string safe for URL
   */
  static async encrypt(plaintext: string, secret: string): Promise<string> {
    const saltBytes = crypto.getRandomValues(new Uint8Array(Cipher.saltByteLength))
    const ivBytes = crypto.getRandomValues(new Uint8Array(Cipher.ivByteLength))
    const derivedKey = await Cipher.deriveKey(secret, saltBytes)
    const plaintextBytes = new TextEncoder().encode(plaintext)
    const encryptedBytes = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: ivBytes, tagLength: 128 },
      derivedKey,
      plaintextBytes
    )
    const combinedBytes = new Uint8Array(
      saltBytes.length + ivBytes.length + encryptedBytes.byteLength
    )
    combinedBytes.set(saltBytes, 0)
    combinedBytes.set(ivBytes, saltBytes.length)
    combinedBytes.set(new Uint8Array(encryptedBytes), saltBytes.length + ivBytes.length)
    return Cipher.bytesToBase64Url(combinedBytes)
  }

  /**
   * Decode base64url string to bytes.
   * @description Returns null when input is invalid.
   * @param base64UrlString - Base64url-encoded string
   * @returns Decoded bytes or null
   */
  private static base64UrlToBytes(base64UrlString: string): Uint8Array | null {
    try {
      const base64String = base64UrlString.replace(/-/g, '+').replace(/_/g, '/')
      const paddingLength = (4 - (base64String.length % 4)) % 4
      const binaryString = atob(base64String + '='.repeat(paddingLength))
      const outputBytes = new Uint8Array(binaryString.length)
      for (let index = 0; index < binaryString.length; index++) {
        outputBytes[index] = binaryString.charCodeAt(index)
      }
      return outputBytes
    } catch {
      return null
    }
  }

  /**
   * Encode bytes as base64url string.
   * @description URL-safe encoding without padding.
   * @param inputBytes - Raw bytes to encode
   * @returns Base64url string
   */
  private static bytesToBase64Url(inputBytes: Uint8Array): string {
    return btoa(String.fromCharCode(...inputBytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  }

  /**
   * Derive AES key via PBKDF2.
   * @description Uses SHA-256 with 100k iterations.
   * @param secret - Shared secret string
   * @param saltBytes - Salt bytes for derivation
   * @returns CryptoKey for AES-GCM
   */
  private static async deriveKey(secret: string, saltBytes: Uint8Array): Promise<CryptoKey> {
    const rawKeyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      'PBKDF2',
      false,
      ['deriveBits']
    )
    const saltBytesCopy = new Uint8Array(saltBytes)
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBytesCopy,
        iterations: Cipher.pbkdf2IterationCount,
        hash: 'SHA-256'
      },
      rawKeyMaterial,
      Cipher.keyBitLength
    )
    return crypto.subtle.importKey('raw', derivedBits, { name: 'AES-GCM' }, false, [
      'encrypt',
      'decrypt'
    ])
  }
}
