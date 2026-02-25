import { assert, assertFalse } from '@std/assert'
import { Email, type EmailOptions } from '@app/index.ts'

Deno.test('Email - allowDisplayName and allowInternational combined', () => {
  assert(
    Email.isValid('Name <用户@domain.com>', {
      allowDisplayName: true,
      allowInternational: true
    })
  )
})

Deno.test('Email - allowDisplayName false rejects angle-addr as invalid', () => {
  assertFalse(Email.isValid('Name <a@b.com>', { allowDisplayName: false }))
  assertFalse(Email.isValid('"Name" <a@b.com>', { allowDisplayName: false }))
})

Deno.test('Email - allowDisplayName true accepts angle-addr', () => {
  assert(Email.isValid('Name <a@b.com>', { allowDisplayName: true }))
  assert(Email.isValid('"Name" <user@domain.com>', { allowDisplayName: true }))
})

Deno.test('Email - allowDisplayName true extracts addr-spec only', () => {
  assert(Email.isValid('John Doe <john.doe@example.com>', { allowDisplayName: true }))
})

Deno.test('Email - allowDisplayName true rejects angle-addr with trailing text', () => {
  assertFalse(Email.isValid('Name <a@b.com> extra', { allowDisplayName: true }))
  assertFalse(Email.isValid('  A <user@example.com> @other  ', { allowDisplayName: true }))
})

Deno.test('Email - allowInternational false rejects non-ASCII local-part', () => {
  assertFalse(Email.isValid('用户@domain.com', { allowInternational: false }))
  assertFalse(Email.isValid('用户@domain.com'))
})

Deno.test('Email - allowInternational true allows UTF-8 in local-part', () => {
  assert(Email.isValid('用户@domain.com', { allowInternational: true }))
  assert(Email.isValid('tëst@domain.com', { allowInternational: true }))
})

Deno.test('Email - domain label cannot start or end with hyphen', () => {
  assertFalse(Email.isValid('a@-domain.com'))
  assertFalse(Email.isValid('a@domain-.com'))
  assert(Email.isValid('a@mid-domain.com'))
})

Deno.test('Email - domain must have valid label structure', () => {
  assert(Email.isValid('a@b.co'))
  assertFalse(Email.isValid('a@.domain.com'))
  assertFalse(Email.isValid('a@domain..com'))
})

Deno.test('Email - Email.getDomain and getLocalPart extract from angle-addr', () => {
  assert(Email.getDomain('Display Name <user@example.com>') === 'example.com')
  assert(Email.getLocalPart('Display Name <user@example.com>') === 'user')
  assert(Email.getDomain('  A <a@b.co>  ') === 'b.co')
  assert(Email.getLocalPart('  A <a@b.co>  ') === 'a')
})

Deno.test('Email - Email.getDomain invalid returns null', () => {
  assert(Email.getDomain('') === null)
  assert(Email.getDomain('no-at') === null)
  assert(Email.getDomain('@only.com') === null)
  assert(Email.getDomain(null as unknown as string) === null)
})

Deno.test('Email - Email.getDomain returns domain lowercased', () => {
  assert(Email.getDomain('user@Example.COM') === 'example.com')
  assert(Email.getDomain('a@b.co') === 'b.co')
  assert(Email.getDomain('  x@Y.Z.ORG  ') === 'y.z.org')
})

Deno.test('Email - Email.getLocalPart invalid returns null', () => {
  assert(Email.getLocalPart('') === null)
  assert(Email.getLocalPart('@domain.com') === null)
  assert(Email.getLocalPart(null as unknown as string) === null)
})

Deno.test('Email - Email.getLocalPart returns local part as-is', () => {
  assert(Email.getLocalPart('User+tag@domain.com') === 'User+tag')
  assert(Email.getLocalPart('a@b.co') === 'a')
})

Deno.test('Email - Email.normalize angle-addr extracted then normalized', () => {
  assert(Email.normalize('Name <user@EXAMPLE.COM>') === 'user@example.com')
})

Deno.test('Email - Email.normalize invalid returns null', () => {
  assert(Email.normalize('') === null)
  assert(Email.normalize('no-at-sign') === null)
  assert(Email.normalize('@domain.com') === null)
  assert(Email.normalize('user@') === null)
  assert(Email.normalize(null as unknown as string) === null)
})

Deno.test('Email - Email.normalize optional lowercase local', () => {
  assert(Email.normalize('User@DOMAIN.com', { lowercaseLocal: false }) === 'User@domain.com')
  assert(Email.normalize('User@DOMAIN.com', { lowercaseLocal: true }) === 'user@domain.com')
})

Deno.test('Email - Email.normalize trims and lowercases domain', () => {
  assert(Email.normalize('  User@EXAMPLE.COM  ') === 'User@example.com')
  assert(Email.normalize('a@B.Co') === 'a@b.co')
  assert(Email.normalize('x@Y.Z.ORG') === 'x@y.z.org')
})

Deno.test('Email - invalid at-sign position', () => {
  assertFalse(Email.isValid('@domain.com'))
  assertFalse(Email.isValid('user@'))
  assertFalse(Email.isValid('@'))
})

Deno.test('Email - invalid chars in local-part ASCII mode', () => {
  assertFalse(Email.isValid('user name@domain.com'))
  assertFalse(Email.isValid('user"name@domain.com'))
  assertFalse(Email.isValid('user<>@domain.com'))
})

Deno.test('Email - invalid domain over 253', () => {
  const domain = 'a'.repeat(252) + '.co'
  assertFalse(Email.isValid(`u@${domain}`))
})

Deno.test('Email - invalid domain single char TLD', () => {
  assertFalse(Email.isValid('a@b.c'))
})

Deno.test('Email - invalid domain without dot', () => {
  assertFalse(Email.isValid('user@domain'))
  assertFalse(Email.isValid('a@b'))
})

Deno.test('Email - invalid empty or whitespace-only', () => {
  assertFalse(Email.isValid(''))
  assertFalse(Email.isValid('   '))
  assertFalse(Email.isValid('\t'))
})

Deno.test('Email - invalid local or domain empty', () => {
  assertFalse(Email.isValid('@domain.com'))
  assertFalse(Email.isValid('user@'))
})

Deno.test('Email - invalid local-part over 64', () => {
  const local = 'a'.repeat(65)
  assertFalse(Email.isValid(`${local}@domain.com`))
})

Deno.test('Email - invalid multiple at-sign', () => {
  assertFalse(Email.isValid('user@domain@com'))
  assertFalse(Email.isValid('a@b@c.com'))
})

Deno.test('Email - invalid no at-sign', () => {
  assertFalse(Email.isValid('userdomain.com'))
  assertFalse(Email.isValid('plain'))
})

Deno.test('Email - invalid total length over 254', () => {
  const local = 'a'.repeat(64)
  const domain = 'b.' + 'c'.repeat(250)
  assertFalse(Email.isValid(`${local}@${domain}`))
})

Deno.test('Email - multiple options at once (all length limits custom)', () => {
  const opts: EmailOptions = {
    maxLength: 20,
    localPartMaxLength: 5,
    domainMaxLength: 10
  }
  assert(Email.isValid('ab@xy.co', opts))
  assertFalse(Email.isValid('longlocal@xy.co', opts))
  assertFalse(Email.isValid('ab@longdomain.co', opts))
  assertFalse(Email.isValid('a@b.c', opts))
})

Deno.test('Email - options boundary domainMaxLength 4', () => {
  assert(Email.isValid('a@b.co', { domainMaxLength: 4 }))
  assertFalse(Email.isValid('a@ab.co', { domainMaxLength: 4 }))
})

Deno.test('Email - options boundary localPartMaxLength 1', () => {
  assert(Email.isValid('a@b.co', { localPartMaxLength: 1 }))
  assertFalse(Email.isValid('ab@b.co', { localPartMaxLength: 1 }))
})

Deno.test('Email - options boundary maxLength exact', () => {
  const address = 'a@b.co'
  assert(Email.isValid(address, { maxLength: address.length }))
  assertFalse(Email.isValid(address, { maxLength: address.length - 1 }))
})

Deno.test('Email - options override defaults maxLength', () => {
  const opts: EmailOptions = { maxLength: 10 }
  assert(Email.isValid('a@b.co', opts))
  assertFalse(Email.isValid('long@domain.com', opts))
})

Deno.test('Email - options override domainMaxLength', () => {
  assert(Email.isValid('a@b.co', { domainMaxLength: 5 }))
  assertFalse(Email.isValid('a@longdomain.com', { domainMaxLength: 5 }))
})

Deno.test('Email - options override localPartMaxLength', () => {
  assert(Email.isValid('ab@domain.com', { localPartMaxLength: 2 }))
  assertFalse(Email.isValid('abc@domain.com', { localPartMaxLength: 2 }))
})

Deno.test('Email - RFC 5321/5322 default limits local 64 domain 253 total 254', () => {
  assert(Email.defaultOptions.localPartMaxLength === 64)
  assert(Email.defaultOptions.domainMaxLength === 253)
  assert(Email.defaultOptions.maxLength === 254)
  assert(Email.isValid('a'.repeat(64) + '@b.co'))
  assertFalse(Email.isValid('a'.repeat(65) + '@b.co'))
  const l63 = 'a'.repeat(63)
  const domain252 = `${l63}.${l63}.${l63}.${'b'.repeat(57)}.co`
  assert(domain252.length === 252)
  assert(('u@' + domain252).length === 254)
  assert(Email.isValid('u@' + domain252))
})

Deno.test('Email - security control chars and null byte rejected', () => {
  assertFalse(Email.isValid('a\x00@b.co'))
  assertFalse(Email.isValid('user\n@domain.com'))
  assertFalse(Email.isValid('user\r@domain.com'))
  assertFalse(Email.isValid('a@b.co\x00'))
})

Deno.test('Email - security newline inside angle-addr addr-spec rejected', () => {
  assertFalse(Email.isValid('Name <a@\nb.co>', { allowDisplayName: true }))
})

Deno.test('Email - security non-string input does not throw returns false', () => {
  assertFalse(Email.isValid(null as unknown as string))
  assertFalse(Email.isValid(undefined as unknown as string))
  assertFalse(Email.isValid(123 as unknown as string))
  assertFalse(Email.isValid({} as unknown as string))
})

Deno.test('Email - security options NaN or non-finite rejected', () => {
  assertFalse(Email.isValid('a@b.co', { maxLength: NaN }))
  assertFalse(Email.isValid('a@b.co', { maxLength: Infinity }))
})

Deno.test('Email - security options with negative or zero length rejected', () => {
  assertFalse(Email.isValid('a@b.co', { maxLength: -1 }))
  assertFalse(Email.isValid('a@b.co', { localPartMaxLength: 0 }))
  assertFalse(Email.isValid('a@b.co', { domainMaxLength: -1 }))
})

Deno.test('Email - security very long input rejected quickly', () => {
  const long = 'a'.repeat(10000) + '@b.co'
  assertFalse(Email.isValid(long))
})

Deno.test('Email - trim leading and trailing whitespace', () => {
  assert(Email.isValid('  a@b.co'))
  assert(Email.isValid('a@b.co  '))
  assert(Email.isValid('  a@b.co  '))
})

Deno.test('Email - valid local-part 64 boundary', () => {
  const local = 'a'.repeat(64)
  assert(Email.isValid(`${local}@domain.com`))
})

Deno.test('Email - valid simple addr-spec', () => {
  assert(Email.isValid('a@b.co'))
  assert(Email.isValid('user@domain.com'))
  assert(Email.isValid('john@doe.com'))
  assert(Email.isValid('test@example.org'))
})

Deno.test('Email - valid subdomain and long domain', () => {
  assert(Email.isValid('user@mail.domain.com'))
  assert(Email.isValid('a@sub.domain.co.uk'))
})

Deno.test('Email - valid TLD at least 2 chars', () => {
  assert(Email.isValid('a@b.co'))
  assert(Email.isValid('a@b.info'))
  assertFalse(Email.isValid('a@b.c'))
})

Deno.test('Email - valid total length 254 boundary', () => {
  const localPart = 'a'.repeat(64)
  const domainPart = 'b.' + 'c'.repeat(187)
  const address = `${localPart}@${domainPart}`
  assert(address.length === 254)
  assert(Email.isValid(address))
})

Deno.test('Email - valid with dots in local-part', () => {
  assert(Email.isValid('user.name@domain.com'))
  assert(Email.isValid('first.last@company.co.uk'))
  assert(Email.isValid('u.s.e.r@gmail.com'))
})

Deno.test('Email - valid with plus and hyphen in local-part', () => {
  assert(Email.isValid('user+tag@domain.com'))
  assert(Email.isValid('user-name@domain.com'))
  assert(Email.isValid('u%2B@domain.com'))
  assert(Email.isValid('a_b@domain.com'))
})
