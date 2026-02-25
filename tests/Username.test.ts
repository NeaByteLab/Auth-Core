import { assert, assertFalse } from '@std/assert'
import { Username, type UsernameOptions } from '@app/index.ts'

Deno.test('Username - boundary exactly max length 32', () => {
  const str = 'a'.repeat(32)
  assert(Username.isValid(str))
  assert(Username.normalize(`  ${str}  `) === str)
})

Deno.test('Username - boundary exactly min length 3', () => {
  assert(Username.isValid('abc'))
  assert(Username.normalize('  ABC  ') === 'abc')
})

Deno.test('Username - custom minLength maxLength', () => {
  const opts: UsernameOptions = { minLength: 2, maxLength: 5 }
  assert(Username.isValid('ab', opts))
  assert(Username.isValid('abcde', opts))
  assertFalse(Username.isValid('a', opts))
  assertFalse(Username.isValid('abcdef', opts))
})

Deno.test('Username - draft isValid ab false default minLength 3', () => {
  assertFalse(Username.isValid('ab'))
})

Deno.test('Username - draft isValid jane_doe true', () => {
  assert(Username.isValid('jane_doe'))
})

Deno.test('Username - draft normalize trim and lowercase', () => {
  assert(Username.normalize('  Jane_Doe  ') === 'jane_doe')
})

Deno.test('Username - draft validate jane_doe valid', () => {
  const result = Username.validate('jane_doe', { minLength: 3, maxLength: 32 })
  assert(result.valid)
  assert(result.errors.length === 0)
})

Deno.test('Username - draft validate short returns errors', () => {
  const result = Username.validate('x', { minLength: 3, maxLength: 20 })
  assertFalse(result.valid)
  assert(result.errors.includes('Username must be at least 3 characters'))
})

Deno.test('Username - invalid character rejected', () => {
  assertFalse(Username.isValid('jane-doe'))
  assertFalse(Username.isValid('jane doe'))
  assertFalse(Username.isValid('jane@doe'))
  assertFalse(Username.isValid('jane.doe'))
  assertFalse(Username.isValid('jane\ndoe'))
  assert(Username.normalize('jane-doe') === null)
})

Deno.test('Username - invalid empty string', () => {
  assertFalse(Username.isValid(''))
  assert(Username.normalize('') === null)
  const result = Username.validate('')
  assertFalse(result.valid)
  assert(result.errors.length > 0)
})

Deno.test('Username - invalid whitespace only', () => {
  assertFalse(Username.isValid('   '))
  assert(Username.normalize('   ') === null)
  const result = Username.validate('  \t  ')
  assertFalse(result.valid)
})

Deno.test('Username - non-ASCII rejected', () => {
  assertFalse(Username.isValid('用户'))
  assertFalse(Username.isValid('jane_doe_ñ'))
  assert(Username.normalize('用户') === null)
})

Deno.test('Username - normalize invalid returns null', () => {
  assert(Username.normalize('no-dash') === null)
  assert(Username.normalize('a') === null)
  assert(Username.normalize('a'.repeat(33)) === null)
})

Deno.test('Username - normalize non-string returns null', () => {
  assert(Username.normalize(null as unknown as string) === null)
  assert(Username.normalize(undefined as unknown as string) === null)
})

Deno.test('Username - normalize with custom options', () => {
  assert(Username.normalize('  ab  ', { minLength: 2, maxLength: 32 }) === 'ab')
  assert(Username.normalize('x', { minLength: 1, maxLength: 5 }) === 'x')
})

Deno.test('Username - security control char and null byte rejected', () => {
  assertFalse(Username.isValid('user\x00name'))
  assertFalse(Username.isValid('abc\u0000'))
  assert(Username.normalize('user\x00name') === null)
})

Deno.test('Username - security non-string input rejected', () => {
  assertFalse(Username.isValid(null as unknown as string))
  assertFalse(Username.isValid(undefined as unknown as string))
})

Deno.test('Username - security options maxLength negative rejected', () => {
  const result = Username.validate('abc', { minLength: 3, maxLength: -1 })
  assertFalse(result.valid)
})

Deno.test('Username - security options minLength greater than maxLength rejects all', () => {
  const result = Username.validate('hello', { minLength: 20, maxLength: 10 })
  assertFalse(result.valid)
  assert(result.errors[0] === 'Invalid username length options')
})

Deno.test('Username - security options minLength negative or zero', () => {
  const result = Username.validate('abc', { minLength: -1, maxLength: 32 })
  assertFalse(result.valid)
  assert(result.errors.includes('Invalid username length options'))
})

Deno.test('Username - security options NaN or Infinity rejected', () => {
  assertFalse(Username.isValid('validuser', { minLength: NaN as number }))
  assertFalse(Username.isValid('validuser', { maxLength: NaN as number }))
  assertFalse(Username.isValid('validuser', { maxLength: Infinity }))
})

Deno.test('Username - security very long input rejected quickly', () => {
  const longStr = 'a'.repeat(100_000)
  assertFalse(Username.isValid(longStr))
  assert(Username.normalize(longStr) === null)
})

Deno.test('Username - valid boundary maxLength 32', () => {
  const longStr = 'a'.repeat(32)
  assert(Username.isValid(longStr))
  assertFalse(Username.isValid('a'.repeat(33)))
})

Deno.test('Username - valid boundary minLength 3', () => {
  assert(Username.isValid('abc'))
  assertFalse(Username.isValid('ab'))
})

Deno.test('Username - valid mixed case normalized to lowercase', () => {
  assert(Username.normalize('JaneDoe') === 'janedoe')
  assert(Username.normalize('USER_1') === 'user_1')
})

Deno.test('Username - valid only digits', () => {
  assert(Username.isValid('123'))
  assert(Username.normalize('  456  ') === '456')
})

Deno.test('Username - valid only underscore', () => {
  assertFalse(Username.isValid('_'))
  assert(Username.isValid('___'))
  assert(Username.normalize('  A_B_C  ') === 'a_b_c')
})

Deno.test('Username - validate collects all rule errors', () => {
  const result = Username.validate('@')
  assertFalse(result.valid)
  assert(result.errors.includes('Username must be at least 3 characters'))
  assert(result.errors.includes('Username must contain only letters, numbers, and underscore'))
})

Deno.test('Username - validate invalid options returns single error', () => {
  const result = Username.validate('hello', { minLength: 10, maxLength: 5 })
  assertFalse(result.valid)
  assert(result.errors.includes('Invalid username length options'))
})

Deno.test('Username - validate non-string returns single error', () => {
  const result = Username.validate(null as unknown as string)
  assertFalse(result.valid)
  assert(result.errors.length === 1)
  assert(result.errors[0] === 'Username must be a string')
})

Deno.test('Username - validate returns valid and empty errors when ok', () => {
  const result = Username.validate('valid_user', { minLength: 3, maxLength: 32 })
  assert(result.valid)
  assert(result.errors.length === 0)
})

Deno.test('Username - validate trim then check length and pattern', () => {
  const result = Username.validate('  ab  ')
  assertFalse(result.valid)
  assert(result.errors.includes('Username must be at least 3 characters'))
})
