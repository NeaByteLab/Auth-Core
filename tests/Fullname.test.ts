import { assert, assertFalse } from '@std/assert'
import { Fullname, type FullnameOptions } from '@app/index.ts'

Deno.test('Fullname - allowDigits', () => {
  assertFalse(Fullname.isValid('Jane Doe 2'))
  assert(Fullname.isValid('Jane Doe 2', { allowDigits: true }))
  assert(Fullname.normalize('jane doe 2', { allowDigits: true }) === 'Jane Doe 2')
})

Deno.test('Fullname - boundary max length 128', () => {
  const name = 'A'.repeat(128)
  assert(Fullname.isValid(name))
  assert(Fullname.normalize(name) === 'A' + 'a'.repeat(127))
  assertFalse(Fullname.isValid('A'.repeat(129)))
})

Deno.test('Fullname - boundary min length 2', () => {
  assert(Fullname.isValid('Ab'))
  assert(Fullname.normalize('  ab  ') === 'Ab')
  assertFalse(Fullname.isValid('A'))
})

Deno.test('Fullname - custom minLength maxLength', () => {
  const opts: FullnameOptions = { minLength: 3, maxLength: 10 }
  assert(Fullname.isValid('Abc', opts))
  assert(Fullname.isValid('Abc Def', opts))
  assertFalse(Fullname.isValid('Ab', opts))
  assertFalse(Fullname.isValid('Abc Def Ghij', opts))
})

Deno.test('Fullname - empty string fails with minLength 0 hasLetterRegex', () => {
  const result = Fullname.validate('', { minLength: 0, maxLength: 128 })
  assertFalse(result.valid)
  assert(result.errors.some((e) => e.includes('letter')))
})

Deno.test('Fullname - hyphen and apostrophe', () => {
  assert(Fullname.isValid("Jean-Pierre O'Brien"))
  assert(Fullname.normalize("jean-pierre o'brien") === "Jean-pierre O'brien")
})

Deno.test('Fullname - invalid options returns error', () => {
  const result = Fullname.validate('Jane', { minLength: 10, maxLength: 5 })
  assertFalse(result.valid)
  assert(result.errors.includes('Invalid fullname length options'))
})

Deno.test('Fullname - non-string returns false or null', () => {
  assertFalse(Fullname.isValid(null as unknown as string))
  assert(Fullname.normalize(null as unknown as string) === null)
  const result = Fullname.validate(null as unknown as string)
  assertFalse(result.valid)
  assert(result.errors.includes('Fullname must be a string'))
})

Deno.test('Fullname - reject empty string', () => {
  assertFalse(Fullname.isValid(''))
  assert(Fullname.normalize('') === null)
})

Deno.test('Fullname - reject invalid characters', () => {
  assertFalse(Fullname.isValid('Jane@Doe'))
  assertFalse(Fullname.isValid('Jane Doe!'))
  assert(Fullname.normalize('Jane@Doe') === null)
})

Deno.test('Fullname - reject only spaces and hyphen', () => {
  assertFalse(Fullname.isValid('   -   '))
  assert(Fullname.normalize('   -   ') === null)
})

Deno.test('Fullname - RFC 6350 FN subset letters space hyphen apostrophe', () => {
  assert(Fullname.isValid('Jane Doe'))
  assert(Fullname.isValid("Jean-Pierre O'Brien"))
  assertFalse(Fullname.isValid('Jane@Doe'))
  assertFalse(Fullname.isValid('Jane Doe!'))
})

Deno.test('Fullname - titleCase false', () => {
  assert(Fullname.normalize('  jane doe  ', { titleCase: false }) === 'jane doe')
})

Deno.test('Fullname - valid simple name', () => {
  assert(Fullname.isValid('Jane Doe'))
  assert(Fullname.normalize('  jane   DOE  ') === 'Jane Doe')
})

Deno.test('Fullname - validate returns errors for invalid', () => {
  const result = Fullname.validate('')
  assertFalse(result.valid)
  assert(result.errors.length > 0)
})

Deno.test('Fullname - validate returns valid', () => {
  const result = Fullname.validate('Jane Doe')
  assert(result.valid)
  assert(result.errors.length === 0)
})
