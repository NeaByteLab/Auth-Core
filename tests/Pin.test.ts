import { assert, assertFalse } from '@std/assert'
import { Pin, type PinOptions } from '@app/index.ts'

Deno.test('Pin - boundary exactly max length 8', () => {
  const pin = '1'.repeat(8)
  assert(Pin.isValid(pin))
  assert(Pin.normalize(`  ${pin}  `) === pin)
  assertFalse(Pin.isValid('1'.repeat(9)))
})

Deno.test('Pin - boundary exactly min length 4', () => {
  assert(Pin.isValid('1234'))
  assert(Pin.normalize('  1234  ') === '1234')
  assertFalse(Pin.isValid('123'))
})

Deno.test('Pin - custom minLength maxLength', () => {
  const opts: PinOptions = { minLength: 2, maxLength: 5 }
  assert(Pin.isValid('12', opts))
  assert(Pin.isValid('12345', opts))
  assertFalse(Pin.isValid('1', opts))
  assertFalse(Pin.isValid('123456', opts))
})

Deno.test('Pin - invalid above max length', () => {
  assertFalse(Pin.isValid('1'.repeat(9)))
  assertFalse(Pin.isValid('1'.repeat(20)))
  assert(Pin.normalize('1'.repeat(9)) === null)
})

Deno.test('Pin - invalid below min length', () => {
  assertFalse(Pin.isValid(''))
  assertFalse(Pin.isValid('1'))
  assertFalse(Pin.isValid('12'))
  assertFalse(Pin.isValid('123'))
})

Deno.test('Pin - invalid empty string', () => {
  assertFalse(Pin.isValid(''))
  assert(Pin.normalize('') === null)
  const result = Pin.validate('')
  assertFalse(result.valid)
  assert(result.errors.length > 0)
})

Deno.test('Pin - invalid non-digits rejected', () => {
  assertFalse(Pin.isValid('123a'))
  assertFalse(Pin.isValid('a123'))
  assertFalse(Pin.isValid('12 34'))
  assertFalse(Pin.isValid('1.234'))
  assertFalse(Pin.isValid('-1234'))
  assertFalse(Pin.isValid('+1234'))
  assertFalse(Pin.isValid('12\n34'))
  assert(Pin.normalize('12a34') === null)
})

Deno.test('Pin - invalid whitespace only', () => {
  assertFalse(Pin.isValid('   '))
  assert(Pin.normalize('   ') === null)
  const result = Pin.validate('  \t  ')
  assertFalse(result.valid)
})

Deno.test('Pin - normalize invalid returns null', () => {
  assert(Pin.normalize('12ab') === null)
  assert(Pin.normalize('12') === null)
  assert(Pin.normalize('1'.repeat(9)) === null)
  assert(Pin.normalize('  ') === null)
})

Deno.test('Pin - normalize non-string returns null', () => {
  assert(Pin.normalize(null as unknown as string) === null)
  assert(Pin.normalize(undefined as unknown as string) === null)
})

Deno.test('Pin - normalize trim only', () => {
  assert(Pin.normalize('  1234  ') === '1234')
  assert(Pin.normalize('\t5678\t') === '5678')
})

Deno.test('Pin - normalize with custom options', () => {
  assert(Pin.normalize('  12  ', { minLength: 2, maxLength: 5 }) === '12')
  assert(Pin.normalize('9', { minLength: 1, maxLength: 5 }) === '9')
})

Deno.test('Pin - security control char and null byte rejected', () => {
  assertFalse(Pin.isValid('12\x0034'))
  assertFalse(Pin.isValid('1234\u0000'))
  assert(Pin.normalize('12\x0034') === null)
})

Deno.test('Pin - security non-string input rejected', () => {
  assertFalse(Pin.isValid(null as unknown as string))
  assertFalse(Pin.isValid(undefined as unknown as string))
  assertFalse(Pin.isValid(12345 as unknown as string))
})

Deno.test('Pin - security options maxLength negative rejected', () => {
  const result = Pin.validate('1234', { minLength: 4, maxLength: -1 })
  assertFalse(result.valid)
})

Deno.test('Pin - security options minLength greater than maxLength rejects all', () => {
  const result = Pin.validate('1234', { minLength: 8, maxLength: 4 })
  assertFalse(result.valid)
  assert(result.errors[0] === 'Invalid pin length options')
})

Deno.test('Pin - security options minLength negative or zero', () => {
  const result = Pin.validate('1234', { minLength: -1, maxLength: 8 })
  assertFalse(result.valid)
  assert(result.errors.includes('Invalid pin length options'))
})

Deno.test('Pin - security options NaN or Infinity rejected', () => {
  assertFalse(Pin.isValid('1234', { minLength: NaN as number }))
  assertFalse(Pin.isValid('1234', { maxLength: NaN as number }))
  assertFalse(Pin.isValid('1234', { maxLength: Infinity }))
})

Deno.test('Pin - security very long input rejected quickly', () => {
  const longStr = '1'.repeat(100_000)
  assertFalse(Pin.isValid(longStr))
  assert(Pin.normalize(longStr) === null)
})

Deno.test('Pin - valid four digit common case', () => {
  assert(Pin.isValid('1234'))
  assert(Pin.isValid('0000'))
  assert(Pin.normalize('  0000  ') === '0000')
})

Deno.test('Pin - valid leading zeros', () => {
  assert(Pin.isValid('0123'))
  assert(Pin.isValid('0000', { minLength: 4, maxLength: 4 }))
  assert(Pin.normalize('  0012  ') === '0012')
})

Deno.test('Pin - valid single digit with minLength 1 maxLength 1', () => {
  const opts: PinOptions = { minLength: 1, maxLength: 1 }
  assert(Pin.isValid('0', opts))
  assert(Pin.isValid('9', opts))
  assert(Pin.normalize('  7  ', opts) === '7')
  assertFalse(Pin.isValid('', opts))
  assertFalse(Pin.isValid('12', opts))
})

Deno.test('Pin - valid six digit with options', () => {
  const opts: PinOptions = { minLength: 6, maxLength: 6 }
  assert(Pin.isValid('123456', opts))
  assert(Pin.normalize('  123456  ', opts) === '123456')
  assertFalse(Pin.isValid('12345', opts))
  assertFalse(Pin.isValid('1234567', opts))
})

Deno.test('Pin - validate collects all rule errors', () => {
  const result = Pin.validate('1a')
  assertFalse(result.valid)
  assert(result.errors.includes('PIN must be at least 4 characters'))
  assert(result.errors.includes('PIN must contain only digits'))
})

Deno.test('Pin - validate invalid options returns single error', () => {
  const result = Pin.validate('1234', { minLength: 10, maxLength: 5 })
  assertFalse(result.valid)
  assert(result.errors.includes('Invalid pin length options'))
})

Deno.test('Pin - validate non-string returns single error', () => {
  const result = Pin.validate(null as unknown as string)
  assertFalse(result.valid)
  assert(result.errors.length === 1)
  assert(result.errors[0] === 'PIN must be a string')
})

Deno.test('Pin - validate returns valid and empty errors when ok', () => {
  const result = Pin.validate('1234', { minLength: 4, maxLength: 8 })
  assert(result.valid)
  assert(result.errors.length === 0)
})

Deno.test('Pin - validate trim then check length', () => {
  const result = Pin.validate('  12  ')
  assertFalse(result.valid)
  assert(result.errors.includes('PIN must be at least 4 characters'))
})
