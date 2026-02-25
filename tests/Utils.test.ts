import { assert, assertFalse } from '@std/assert'
import { Utils } from '@app/index.ts'

Deno.test('Utils - collapseSpaces trims and single space', () => {
  assert(Utils.collapseSpaces('  a  b  c  ') === 'a b c')
  assert(Utils.collapseSpaces('a\t\nb') === 'a b')
  assert(Utils.collapseSpaces('') === '')
  assert(Utils.collapseSpaces('single') === 'single')
})

Deno.test('Utils - invalidOptionsResult and notStringResult shape', () => {
  const invalidOpts = Utils.invalidOptionsResult('field')
  assertFalse(invalidOpts.valid)
  assert(invalidOpts.errors.length === 1)
  assert(
    (invalidOpts.errors[0] ?? '').includes('Invalid') &&
      (invalidOpts.errors[0] ?? '').includes('field')
  )
  const notStr = Utils.notStringResult('X')
  assertFalse(notStr.valid)
  assert(notStr.errors.length === 1)
  assert((notStr.errors[0] ?? '').includes('must be a string'))
})

Deno.test('Utils - isNonNegativeFinite', () => {
  assert(Utils.isNonNegativeFinite(0))
  assert(Utils.isNonNegativeFinite(1))
  assert(Utils.isNonNegativeFinite(1.5))
  assertFalse(Utils.isNonNegativeFinite(-1))
  assertFalse(Utils.isNonNegativeFinite(NaN))
  assertFalse(Utils.isNonNegativeFinite(Infinity))
  assertFalse(Utils.isNonNegativeFinite(-Infinity))
})

Deno.test('Utils - isString', () => {
  assert(Utils.isString(''))
  assert(Utils.isString('x'))
  assertFalse(Utils.isString(null))
  assertFalse(Utils.isString(undefined))
  assertFalse(Utils.isString(0))
  assertFalse(Utils.isString({}))
})

Deno.test('Utils - isValidMinMax', () => {
  assert(Utils.isValidMinMax(0, 10))
  assert(Utils.isValidMinMax(5, 5))
  assertFalse(Utils.isValidMinMax(10, 5))
  assertFalse(Utils.isValidMinMax(-1, 10))
  assertFalse(Utils.isValidMinMax(0, NaN))
})

Deno.test('Utils - lengthErrors', () => {
  assert(Utils.lengthErrors('ab', 3, 10, 'X').includes('X must be at least 3 characters'))
  assert(Utils.lengthErrors('abcdefghijk', 1, 5, 'X').includes('X must be at most 5 characters'))
  assert(Utils.lengthErrors('abc', 3, 10, 'X').length === 0)
  const both = Utils.lengthErrors('a', 3, 5, 'X')
  assert(both.length === 1)
  assert((both[0] ?? '').includes('at least'))
})

Deno.test('Utils - randomInRange inclusive and bounded', () => {
  for (let i = 0; i < 50; i++) {
    const v = Utils.randomInRange(5, 10)
    assert(v >= 5 && v <= 10)
  }
  assert(Utils.randomInRange(7, 7) === 7)
  assert(Utils.randomInRange(3, 2) === 3)
})

Deno.test('Utils - resolveMinMax', () => {
  assert(Utils.resolveMinMax({}, { minLength: 2, maxLength: 10 })?.minLength === 2)
  assert(Utils.resolveMinMax({ minLength: 5 }, { minLength: 2, maxLength: 10 })?.minLength === 5)
  assert(
    Utils.resolveMinMax({ minLength: 1, maxLength: 3 }, { minLength: 2, maxLength: 10 })
      ?.maxLength === 3
  )
  assert(
    Utils.resolveMinMax({ minLength: 20, maxLength: 10 }, { minLength: 2, maxLength: 100 }) === null
  )
})

Deno.test('Utils - toTitleCase', () => {
  assert(Utils.toTitleCase('jane doe') === 'Jane Doe')
  assert(Utils.toTitleCase('a') === 'A')
  assert(Utils.toTitleCase('') === '')
  assert(Utils.toTitleCase("o'brien") === "O'brien")
})

Deno.test('Utils - toValidationResult', () => {
  const ok = Utils.toValidationResult([])
  assert(ok.valid && ok.errors.length === 0)
  const fail = Utils.toValidationResult(['err1'])
  assertFalse(fail.valid)
  assert(fail.errors.length === 1 && fail.errors[0] === 'err1')
})
