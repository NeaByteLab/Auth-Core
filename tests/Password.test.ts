import { assert, assertFalse } from '@std/assert'
import { Password } from '@app/index.ts'
import type { PasswordOptions } from '@app/index.ts'

Deno.test('Password - all options explicitly set', () => {
  const opts: PasswordOptions = {
    minLength: 8,
    maxLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecial: true
  }
  assertFalse(Password.isValid('Short1!', opts))
  assert(Password.isValid('Pass1234!', opts))
  assert(Password.isValid('Pass1234!ab', opts))
  assertFalse(Password.isValid('Pass1234!abcx', opts))
})

Deno.test('Password - all requirements combined', () => {
  const opts: PasswordOptions = {
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecial: true
  }
  assertFalse(Password.isValid('password', opts))
  assertFalse(Password.isValid('Password', opts))
  assertFalse(Password.isValid('Password1', opts))
  assert(Password.isValid('Password1!', opts))
  assert(Password.isValid('P@ssw0rd', opts))
})

Deno.test('Password - backslash in special', () => {
  assert(Password.isValid('aaaaaaa\\', { requireSpecial: true }))
})

Deno.test('Password - boundary minLength 1 maxLength 1', () => {
  const opts: PasswordOptions = { minLength: 1, maxLength: 1 }
  assert(Password.isValid('a', opts))
  assertFalse(Password.isValid('', opts))
  assertFalse(Password.isValid('ab', opts))
})

Deno.test('Password - custom maxLength', () => {
  assert(Password.isValid('abcdefgh', { maxLength: 8 }))
  assertFalse(Password.isValid('abcdefghi', { maxLength: 8 }))
  assert(Password.isValid('a'.repeat(10), { minLength: 10, maxLength: 10 }))
})

Deno.test('Password - custom minLength', () => {
  assert(Password.isValid('ab', { minLength: 2 }))
  assertFalse(Password.isValid('a', { minLength: 2 }))
  assert(Password.isValid('12345', { minLength: 5 }))
})

Deno.test('Password - custom minLength and maxLength', () => {
  const opts: PasswordOptions = { minLength: 4, maxLength: 6 }
  assertFalse(Password.isValid('ab', opts))
  assert(Password.isValid('abcd', opts))
  assert(Password.isValid('abcde', opts))
  assert(Password.isValid('abcdef', opts))
  assertFalse(Password.isValid('abcdefg', opts))
})

Deno.test('Password - invalid above max length', () => {
  assertFalse(Password.isValid('a'.repeat(129)))
  assertFalse(Password.isValid('a'.repeat(200)))
})

Deno.test('Password - invalid below min length', () => {
  assertFalse(Password.isValid(''))
  assertFalse(Password.isValid('1'))
  assertFalse(Password.isValid('1234567'))
})

Deno.test('Password - invalid empty string', () => {
  assertFalse(Password.isValid(''))
})

Deno.test('Password - length 129 invalid with default max 128', () => {
  assertFalse(Password.isValid('a'.repeat(129)))
})

Deno.test('Password - length 7 invalid with default min 8', () => {
  assertFalse(Password.isValid('1234567'))
})

Deno.test('Password - minLength and maxLength with one require*', () => {
  const opts: PasswordOptions = { minLength: 6, maxLength: 10, requireDigit: true }
  assertFalse(Password.isValid('abcde', opts))
  assertFalse(Password.isValid('abcdef', opts))
  assert(Password.isValid('abcdef1', opts))
  assert(Password.isValid('1234567', opts))
  assertFalse(Password.isValid('12345678901', opts))
})

Deno.test('Password - non-string returns false', () => {
  assertFalse(Password.isValid(null as unknown as string))
  assertFalse(Password.isValid(undefined as unknown as string))
  assertFalse(Password.isValid(12345 as unknown as string))
})

Deno.test('Password - Password.generate default length in range', () => {
  for (let i = 0; i < 10; i++) {
    const generated = Password.generate()
    assert(generated.length >= 8 && generated.length <= 128)
    assert(Password.isValid(generated))
  }
})

Deno.test('Password - Password.generate satisfies options and Password.isValid', () => {
  const opts: PasswordOptions = {
    minLength: 12,
    maxLength: 20,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecial: true
  }
  for (let i = 0; i < 20; i++) {
    const generated = Password.generate(opts)
    assert(generated.length >= 12 && generated.length <= 20)
    assert(Password.isValid(generated, opts))
  }
})

Deno.test('Password - Password.strength score increases with variety', () => {
  const strength1 = Password.strength('aaaaaaaa')
  const strength2 = Password.strength('Aaaaaaaa')
  const strength3 = Password.strength('Aaaaaaa1')
  const strength4 = Password.strength('Aaaaaa1!')
  assert(
    strength4.score >= strength3.score &&
      strength3.score >= strength2.score &&
      strength2.score >= strength1.score
  )
})

Deno.test('Password - Password.strength weak medium strong', () => {
  assert(Password.strength('').category === 'weak' && Password.strength('').score === 0)
  assert(Password.strength('short').category === 'weak')
  assert(
    Password.strength('longenough').category === 'medium' ||
      Password.strength('longenough').category === 'weak'
  )
  const strong = Password.strength('Password123!')
  assert(strong.category === 'strong' || strong.category === 'medium')
  assert(strong.score >= 0 && strong.score <= 100)
})

Deno.test('Password - Password.validate collects all rule errors', () => {
  const result = Password.validate('short', {
    minLength: 8,
    requireUppercase: true,
    requireDigit: true
  })
  assert(result.valid === false)
  assert(result.errors.includes('Password must be at least 8 characters'))
  assert(result.errors.includes('Password must contain at least one uppercase letter'))
  assert(result.errors.includes('Password must contain at least one digit'))
})

Deno.test('Password - Password.validate invalid options returns single error', () => {
  const result = Password.validate('password', { minLength: 20, maxLength: 10 })
  assert(result.valid === false)
  assert(result.errors.length === 1)
  assert(result.errors[0] === 'Invalid password length options')
})

Deno.test('Password - Password.validate non-string returns single error', () => {
  const result = Password.validate(null as unknown as string)
  assert(result.valid === false)
  assert(result.errors.length === 1)
  assert(result.errors[0] === 'Password must be a string')
})

Deno.test('Password - Password.validate returns valid and empty errors when ok', () => {
  const result = Password.validate('Password1!', {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecial: true
  })
  assert(result.valid === true)
  assert(result.errors.length === 0)
})

Deno.test('Password - requireDigit when true', () => {
  assertFalse(Password.isValid('password', { requireDigit: true }))
  assert(Password.isValid('password1', { requireDigit: true }))
  assert(Password.isValid('12345678', { requireDigit: true }))
})

Deno.test('Password - requireLowercase when true', () => {
  assertFalse(Password.isValid('PASSWORD', { requireLowercase: true }))
  assert(Password.isValid('password', { requireLowercase: true }))
  assert(Password.isValid('Password', { requireLowercase: true }))
})

Deno.test('Password - requireSpecial when true', () => {
  assertFalse(Password.isValid('Password1', { requireSpecial: true }))
  assert(Password.isValid('Password1!', { requireSpecial: true }))
  assert(Password.isValid('P@ssw0rd', { requireSpecial: true }))
})

Deno.test('Password - requireUppercase when true', () => {
  assertFalse(Password.isValid('password', { requireUppercase: true }))
  assert(Password.isValid('Password', { requireUppercase: true }))
  assert(Password.isValid('PASSWORD', { requireUppercase: true }))
})

Deno.test('Password - require* false or omitted does not enforce', () => {
  assert(Password.isValid('password', { requireUppercase: false }))
  assert(Password.isValid('PASSWORD', { requireLowercase: false }))
  assert(Password.isValid('abcdefgh', { requireDigit: false }))
  assert(Password.isValid('abcdefgh', { requireSpecial: false }))
})

Deno.test('Password - security control char in password', () => {
  assert(Password.isValid('pass\x00word'))
  assert(Password.isValid('password\n'))
})

Deno.test('Password - security non-string input rejected', () => {
  assertFalse(Password.isValid({} as unknown as string))
  assertFalse(Password.isValid([] as unknown as string))
  assertFalse(Password.isValid(true as unknown as string))
})

Deno.test('Password - security options minLength greater than maxLength rejects all', () => {
  const opts: PasswordOptions = { minLength: 10, maxLength: 5 }
  assertFalse(Password.isValid('1234567890', opts))
  assertFalse(Password.isValid('12345', opts))
})

Deno.test('Password - security options minLength negative or zero', () => {
  assertFalse(Password.isValid('abc', { minLength: -1 }))
})

Deno.test('Password - security options maxLength negative rejected', () => {
  assertFalse(Password.isValid('password', { maxLength: -1 }))
})

Deno.test('Password - security options NaN or Infinity rejected', () => {
  assertFalse(Password.isValid('password', { minLength: NaN }))
  assertFalse(Password.isValid('password', { maxLength: NaN }))
  assertFalse(Password.isValid('password', { maxLength: Infinity }))
})

Deno.test('Password - security very long input rejected quickly', () => {
  assertFalse(Password.isValid('a'.repeat(10000)))
})

Deno.test('Password - special chars in set', () => {
  const specialChars = '!@#$%^&*()_+-=[]{};\':"|,.<>/?'
  const password = 'a'.repeat(7) + specialChars[0]
  assert(password.length >= 8)
  assert(Password.isValid(password, { requireSpecial: true }))
})

Deno.test('Password - three require* (upper + lower + special)', () => {
  const opts: PasswordOptions = {
    requireUppercase: true,
    requireLowercase: true,
    requireSpecial: true
  }
  assertFalse(Password.isValid('password', opts))
  assertFalse(Password.isValid('Password', opts))
  assert(Password.isValid('Password!', opts))
})

Deno.test('Password - two require* only (upper + digit)', () => {
  const opts: PasswordOptions = { requireUppercase: true, requireDigit: true }
  assertFalse(Password.isValid('password', opts))
  assertFalse(Password.isValid('Password', opts))
  assertFalse(Password.isValid('password1', opts))
  assert(Password.isValid('Password1', opts))
})

Deno.test('Password - valid boundary exactly max length 128', () => {
  const password = 'a'.repeat(128)
  assert(Password.isValid(password))
})

Deno.test('Password - valid boundary exactly min length 8', () => {
  assert(Password.isValid('12345678'))
  assert(Password.isValid('abcdefgh'))
})

Deno.test('Password - valid default options min 8 max 128', () => {
  assert(Password.isValid('password'))
  assert(Password.isValid('12345678'))
  assert(Password.isValid('aaaaaaaa'))
  assert(Password.isValid('PASSWORD'))
})
