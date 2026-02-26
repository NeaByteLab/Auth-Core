import { assert, assertFalse } from '@std/assert'
import { Hostname, type HostnameOptions } from '@app/index.ts'

Deno.test('Hostname - boundary max length 253', () => {
  const label = 'a'.repeat(63)
  const host = `${label}.${label}.${label}.ab`
  assert(host.length <= 253)
  assert(Hostname.isValid(host))
})

Deno.test('Hostname - custom minLength maxLength', () => {
  const opts: HostnameOptions = { minLength: 4, maxLength: 10 }
  assert(Hostname.isValid('host', opts))
  assert(Hostname.isValid('a.b.c', opts))
  assertFalse(Hostname.isValid('ab', opts))
  assertFalse(Hostname.isValid('verylonghostname', opts))
})

Deno.test('Hostname - label with hyphen', () => {
  assert(Hostname.isValid('my-server.example.com'))
  assert(Hostname.normalize('my-server.example.com') === 'my-server.example.com')
})

Deno.test('Hostname - reject consecutive dots empty label', () => {
  assertFalse(Hostname.isValid('a..b.com'))
  assertFalse(Hostname.isValid('example..com'))
  const result = Hostname.validate('a..b.com')
  assertFalse(result.valid)
  assert(result.errors.some((e) => e.includes('leading') || e.includes('trailing')))
})

Deno.test('Hostname - reject empty string', () => {
  assertFalse(Hostname.isValid(''))
  assert(Hostname.normalize('') === null)
})

Deno.test('Hostname - reject invalid IDNA label', () => {
  assertFalse(Hostname.isValid('xn--invalid-punycode!!!.com'))
  const resultDot = Hostname.validate('xn--.')
  assertFalse(resultDot.valid)
  assert(resultDot.errors.length > 0)
  const resultBad = Hostname.validate('xn--0')
  assertFalse(resultBad.valid)
  assert(resultBad.errors.some((e) => e.includes('IDNA') || e.includes('invalid')))
})

Deno.test('Hostname - reject label over 63 chars', () => {
  const longLabel = 'a'.repeat(64)
  assertFalse(Hostname.isValid(`${longLabel}.com`))
})

Deno.test('Hostname - reject leading hyphen in label', () => {
  assertFalse(Hostname.isValid('-invalid.example.com'))
  assert(Hostname.normalize('-invalid.example.com') === null)
})

Deno.test('Hostname - reject leading or trailing dot (RFC 1035)', () => {
  assertFalse(Hostname.isValid('.example.com'))
  assertFalse(Hostname.isValid('example.com.'))
  assert(Hostname.normalize('.example.com') === null)
  const result = Hostname.validate('example.com.')
  assertFalse(result.valid)
  assert(result.errors.some((e) => e.includes('leading') || e.includes('trailing')))
})

Deno.test('Hostname - reject trailing hyphen in label', () => {
  assertFalse(Hostname.isValid('invalid-.example.com'))
})

Deno.test('Hostname - RFC 1035 label 63 octets max total 253', () => {
  assert(Hostname.defaultMaxLength === 253)
  assert(Hostname.maxLabelLength === 63)
  const label63 = 'a'.repeat(63)
  assert(Hostname.isValid(`${label63}.com`))
  assertFalse(Hostname.isValid('a'.repeat(64) + '.com'))
})

Deno.test('Hostname - RFC 1123 label may start with digit', () => {
  assert(Hostname.isValid('0example.com'))
  assert(Hostname.isValid('3com.com'))
  assert(Hostname.normalize('0EXAMPLE.COM') === '0example.com')
})

Deno.test('Hostname - single char label valid when minLength 1', () => {
  assert(Hostname.isValid('a', { minLength: 1, maxLength: 253 }))
  assert(Hostname.normalize('  A  ', { minLength: 1, maxLength: 253 }) === 'a')
})

Deno.test('Hostname - single label', () => {
  assert(Hostname.isValid('localhost'))
  assert(Hostname.normalize('LocalHost') === 'localhost')
})

Deno.test('Hostname - valid FQDN for SNI', () => {
  assert(Hostname.isValid('api.example.com'))
  assert(Hostname.normalize('  API.Example.COM  ') === 'api.example.com')
})

Deno.test('Hostname - valid IDNA label', () => {
  assert(Hostname.isValid('xn--mnchen-3ya.de'))
  assert(Hostname.normalize('  XN--MNCHEN-3YA.DE  ') === 'xn--mnchen-3ya.de')
})

Deno.test('Hostname - validate returns errors for invalid', () => {
  const result = Hostname.validate('')
  assertFalse(result.valid)
  assert(result.errors.length > 0)
})

Deno.test('Hostname - validate returns valid', () => {
  const result = Hostname.validate('api.example.com')
  assert(result.valid)
  assert(result.errors.length === 0)
})
