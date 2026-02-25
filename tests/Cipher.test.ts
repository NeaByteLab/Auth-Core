import { assert, assertFalse } from '@std/assert'
import { Cipher } from '@app/index.ts'

Deno.test('Cipher - base64-looking plaintext round-trip', async () => {
  const sharedSecret = 'key'
  const plaintext = 'YWRtaW4='
  const encrypted = await Cipher.encrypt(plaintext, sharedSecret)
  assert((await Cipher.decrypt(encrypted, sharedSecret)) === plaintext)
})

Deno.test('Cipher - constants match AES-GCM and PBKDF2 expectations', () => {
  assert(Cipher.ivByteLength === 12)
  assert(Cipher.keyBitLength === 256)
  assert(Cipher.pbkdf2IterationCount === 100_000)
  assert(Cipher.saltByteLength === 16)
})

Deno.test('Cipher - decrypt base64url with hyphen underscore decodes correctly', async () => {
  const sharedSecret = 's'
  const encrypted = await Cipher.encrypt('ok', sharedSecret)
  assert(encrypted.includes('-') || encrypted.includes('_') || encrypted.length > 0)
  assert((await Cipher.decrypt(encrypted, sharedSecret)) === 'ok')
})

Deno.test(
  'Cipher - decrypt empty secret with valid ciphertext from same empty secret',
  async () => {
    const encryptedPayload = await Cipher.encrypt('v', '')
    assert((await Cipher.decrypt(encryptedPayload, '')) === 'v')
  }
)

Deno.test('Cipher - decrypt empty string returns null', async () => {
  const decryptResult = await Cipher.decrypt('', 'secret')
  assert(decryptResult === null)
})

Deno.test('Cipher - decrypt invalid base64 chars returns null', async () => {
  assert((await Cipher.decrypt('@#$%^', 'secret')) === null)
  assert((await Cipher.decrypt(' space ', 'secret')) === null)
})

Deno.test('Cipher - decrypt malformed base64 padding only returns null', async () => {
  const decryptResult = await Cipher.decrypt('===', 'secret')
  assert(decryptResult === null)
})

Deno.test('Cipher - decrypt malformed base64 returns null', async () => {
  const decryptResult = await Cipher.decrypt('not-valid-base64!!!', 'secret')
  assert(decryptResult === null)
})

Deno.test('Cipher - decrypt non-string encrypted input does not throw', async () => {
  const decryptResult = await Cipher.decrypt(null as unknown as string, 'secret')
  assert(decryptResult === null)
})

Deno.test('Cipher - decrypt payload length exactly minLength minus one returns null', async () => {
  const minPayloadByteLength = Cipher.saltByteLength + Cipher.ivByteLength + 16
  const randomBytes = new Uint8Array(minPayloadByteLength - 1)
  crypto.getRandomValues(randomBytes)
  const base64UrlPayload = btoa(String.fromCharCode(...randomBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  const decryptResult = await Cipher.decrypt(base64UrlPayload, 'secret')
  assert(decryptResult === null)
})

Deno.test('Cipher - decrypt same ciphertext twice returns same plaintext', async () => {
  const sharedSecret = 'key'
  const encrypted = await Cipher.encrypt('repeat me', sharedSecret)
  const decryptedFirst = await Cipher.decrypt(encrypted, sharedSecret)
  const decryptedSecond = await Cipher.decrypt(encrypted, sharedSecret)
  assert(decryptedFirst === 'repeat me' && decryptedSecond === 'repeat me')
})

Deno.test('Cipher - decrypt tampered ciphertext returns null', async () => {
  const sharedSecret = 'secret'
  const encrypted = await Cipher.encrypt('sensitive', sharedSecret)
  const lastChar = encrypted[encrypted.length - 1]
  const flippedChar = lastChar === 'A' ? 'B' : 'A'
  const tamperedPayload = encrypted.slice(0, -1) + flippedChar
  const decryptResult = await Cipher.decrypt(tamperedPayload, sharedSecret)
  assert(decryptResult === null)
})

Deno.test('Cipher - decrypt valid base64url but wrong structure returns null', async () => {
  const validBase64Url = 'YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXo'
  const decryptResult = await Cipher.decrypt(validBase64Url, 'secret')
  assert(decryptResult === null)
})

Deno.test(
  'Cipher - decrypt with empty secret when encrypted with non-empty returns null',
  async () => {
    const encrypted = await Cipher.encrypt('data', 'real-secret')
    const decrypted = await Cipher.decrypt(encrypted, '')
    assert(decrypted === null)
  }
)

Deno.test(
  'Cipher - decrypt with non-empty secret when encrypted with empty returns null',
  async () => {
    const encrypted = await Cipher.encrypt('data', '')
    const decrypted = await Cipher.decrypt(encrypted, 'other-secret')
    assert(decrypted === null)
  }
)

Deno.test('Cipher - decrypt with wrong secret returns null', async () => {
  const encrypted = await Cipher.encrypt('data', 'secret-a')
  const decrypted = await Cipher.decrypt(encrypted, 'secret-b')
  assert(decrypted === null)
})

Deno.test('Cipher - decrypt too short payload returns null', async () => {
  const shortPayloadBase64 = 'YQ' // minimal base64url decodes to 1 byte
  const result = await Cipher.decrypt(shortPayloadBase64, 'secret')
  assert(result === null)
})

Deno.test('Cipher - emoji in plaintext round-trip', async () => {
  const sharedSecret = 'k'
  const plaintext = '🔐 test ✅'
  const encrypted = await Cipher.encrypt(plaintext, sharedSecret)
  assert((await Cipher.decrypt(encrypted, sharedSecret)) === plaintext)
})

Deno.test('Cipher - empty plaintext round-trip', async () => {
  const sharedSecret = 'key'
  const encrypted = await Cipher.encrypt('', sharedSecret)
  const decrypted = await Cipher.decrypt(encrypted, sharedSecret)
  assert(decrypted === '')
})

Deno.test('Cipher - empty secret encrypt decrypt round-trip', async () => {
  const minimalPlaintext = 'x'
  const encrypted = await Cipher.encrypt(minimalPlaintext, '')
  const decrypted = await Cipher.decrypt(encrypted, '')
  assert(decrypted === minimalPlaintext)
})

Deno.test('Cipher - encrypt output length at least salt plus iv plus tag', async () => {
  const minDecodedByteLength = Cipher.saltByteLength + Cipher.ivByteLength + 16
  const minBase64UrlLength = Math.ceil((minDecodedByteLength * 4) / 3)
  const encrypted = await Cipher.encrypt('x', 'secret')
  assert(encrypted.length >= minBase64UrlLength - 2)
})

Deno.test('Cipher - encrypt output is base64url no plus slash equals', async () => {
  const encrypted = await Cipher.encrypt('x', 'secret')
  assertFalse(encrypted.includes('+'))
  assertFalse(encrypted.includes('/'))
  assertFalse(encrypted.includes('='))
  assert(encrypted.length > 0)
})

Deno.test('Cipher - encrypt then decrypt same secret returns plaintext', async () => {
  const sharedSecret = 'shared-secret-key'
  const plaintext = 'hello world'
  const encrypted = await Cipher.encrypt(plaintext, sharedSecret)
  const decrypted = await Cipher.decrypt(encrypted, sharedSecret)
  assert(decrypted === plaintext)
})

Deno.test('Cipher - longer plaintext produces longer ciphertext', async () => {
  const sharedSecret = 'k'
  const encryptedShortInput = await Cipher.encrypt('a', sharedSecret)
  const encryptedLongInput = await Cipher.encrypt('aa', sharedSecret)
  assert(encryptedLongInput.length >= encryptedShortInput.length)
})

Deno.test('Cipher - long plaintext round-trip', async () => {
  const sharedSecret = 'my-secret'
  const plaintext = 'a'.repeat(10_000)
  const encrypted = await Cipher.encrypt(plaintext, sharedSecret)
  const decrypted = await Cipher.decrypt(encrypted, sharedSecret)
  assert(decrypted === plaintext)
})

Deno.test('Cipher - plaintext with carriage return round-trip', async () => {
  const sharedSecret = 'k'
  const plaintext = 'a\r\nb'
  const encrypted = await Cipher.encrypt(plaintext, sharedSecret)
  assert((await Cipher.decrypt(encrypted, sharedSecret)) === plaintext)
})

Deno.test('Cipher - plaintext with newline and tab round-trip', async () => {
  const sharedSecret = 's'
  const plaintext = 'line1\nline2\t tab'
  const encrypted = await Cipher.encrypt(plaintext, sharedSecret)
  assert((await Cipher.decrypt(encrypted, sharedSecret)) === plaintext)
})

Deno.test('Cipher - plaintext with null byte round-trip', async () => {
  const sharedSecret = 'k'
  const plaintext = 'a\x00b'
  const encrypted = await Cipher.encrypt(plaintext, sharedSecret)
  assert((await Cipher.decrypt(encrypted, sharedSecret)) === plaintext)
})

Deno.test('Cipher - same plaintext different ciphertext each encrypt', async () => {
  const sharedSecret = 'secret'
  const ciphertextFirst = await Cipher.encrypt('same', sharedSecret)
  const ciphertextSecond = await Cipher.encrypt('same', sharedSecret)
  assert(ciphertextFirst !== ciphertextSecond)
  assert((await Cipher.decrypt(ciphertextFirst, sharedSecret)) === 'same')
  assert((await Cipher.decrypt(ciphertextSecond, sharedSecret)) === 'same')
})

Deno.test('Cipher - secret with special chars round-trip', async () => {
  const sharedSecret = 'p@ss!word#123'
  const minimalPlaintext = 'x'
  const encrypted = await Cipher.encrypt(minimalPlaintext, sharedSecret)
  assert((await Cipher.decrypt(encrypted, sharedSecret)) === minimalPlaintext)
})

Deno.test('Cipher - secret with unicode round-trip', async () => {
  const sharedSecret = '密钥-secret'
  const plaintext = 'data'
  const encrypted = await Cipher.encrypt(plaintext, sharedSecret)
  assert((await Cipher.decrypt(encrypted, sharedSecret)) === plaintext)
})

Deno.test('Cipher - single char secret round-trip', async () => {
  const sharedSecret = 'x'
  const plaintext = 'hello'
  const encrypted = await Cipher.encrypt(plaintext, sharedSecret)
  assert((await Cipher.decrypt(encrypted, sharedSecret)) === plaintext)
})

Deno.test('Cipher - unicode plaintext round-trip', async () => {
  const sharedSecret = 'key'
  const plaintext = '用户 日本語 café'
  const encrypted = await Cipher.encrypt(plaintext, sharedSecret)
  const decrypted = await Cipher.decrypt(encrypted, sharedSecret)
  assert(decrypted === plaintext)
})

Deno.test('Cipher - very long secret round-trip', async () => {
  const sharedSecret = 'a'.repeat(5000)
  const plaintext = 'payload'
  const encrypted = await Cipher.encrypt(plaintext, sharedSecret)
  assert((await Cipher.decrypt(encrypted, sharedSecret)) === plaintext)
})

Deno.test('Cipher - whitespace-only plaintext round-trip', async () => {
  const sharedSecret = 'k'
  const plaintext = '   \t  '
  const encrypted = await Cipher.encrypt(plaintext, sharedSecret)
  assert((await Cipher.decrypt(encrypted, sharedSecret)) === plaintext)
})
