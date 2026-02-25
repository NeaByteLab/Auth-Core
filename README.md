# Auth-Core [![Module type: Deno/ESM](https://img.shields.io/badge/module%20type-deno%2Fesm-brightgreen)](https://github.com/NeaByteLab/Auth-Core) [![JSR](https://jsr.io/badges/@neabyte/auth-core)](https://jsr.io/@neabyte/auth-core) [![CI](https://github.com/NeaByteLab/Auth-Core/actions/workflows/ci.yaml/badge.svg)](https://github.com/NeaByteLab/Auth-Core/actions/workflows/ci.yaml) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Auth validation, normalization, and generation for the Deno runtime.

## Installation

This module is available on JSR. Add it to your Deno project:

```bash
deno add jsr:@neabyte/auth-core
```

## Usage

Non-string input is treated as invalid: validators return `false` or `null` or `{ valid: false, errors: ['… must be a string'] }`. Invalid length options (e.g. `minLength` &gt; `maxLength`) yield `{ valid: false, errors: ['Invalid … length options'] }`.

### Cipher

Two-way AES-256-GCM encrypt and decrypt with a shared secret. Uses PBKDF2 (SHA-256, 100k iterations) for key derivation; random salt and IV per encryption. Output is base64url-safe for URLs.

```typescript
import { Cipher } from '@neabyte/auth-core'

// Encrypt plaintext (e.g. token or payload)
const encrypted = await Cipher.encrypt('sensitive data', 'your-secret')
// e.g. 'xYz...' (base64url)

// Decrypt with same secret; null if invalid or wrong secret
const plain = await Cipher.decrypt(encrypted, 'your-secret')
// 'sensitive data'
```

Wrong secret, corrupted payload, or invalid base64url yield `null` from `decrypt()`.

### Email

Validate format, normalize, and extract domain or local part. Options override defaults. Email has no `validate()`; use `isValid()` for a boolean check.

```typescript
import { Email } from '@neabyte/auth-core'

// Basic validation and normalization
Email.isValid('john@doe.com')
// true

Email.normalize('  John@DOE.COM  ')
// 'John@doe.com'

// Extract parts (domain always lowercased)
Email.getDomain('user@example.com')
// 'example.com'

Email.getLocalPart('user@example.com')
// 'user'
```

With display name and strict options:

```typescript
Email.isValid('"Jane" <jane@example.com>', { allowDisplayName: true })
// true

Email.normalize('"Jane" <jane@example.com>', { lowercaseLocal: true })
// 'jane@example.com'
```

### Fullname

Validate and normalize full names: conservative subset for formatted name (Unicode letters, space, hyphen, apostrophe; optional digits). Aligned with RFC 6350 (vCard FN) and Unicode per RFC 7700. Options: `minLength`, `maxLength` (default 2–128), `allowDigits`, `titleCase` (for normalize).

```typescript
import { Fullname } from '@neabyte/auth-core'

Fullname.isValid('Jane Doe')
// true

Fullname.normalize('  jane   DOE  ')
// 'Jane Doe'

Fullname.validate("Jean-Pierre O'Brien")
// { valid: true, errors: [] }
```

Invalid characters or length outside range yield `false` / `null` / `{ valid: false, errors: [...] }`. Normalize trims, collapses spaces, and applies title-case by default.

### Hostname (SNI / DNS)

Validate and normalize hostnames for TLS Server Name Indication (SNI) or DNS. Follows RFC 1035 (lengths), RFC 1123 (label charset), RFC 6066 (SNI), IDNA via punycode (RFC 5890/5891). Options: `minLength`, `maxLength` (default 1–253). No leading/trailing dot.

```typescript
import { Hostname } from '@neabyte/auth-core'

Hostname.isValid('api.example.com')
// true

Hostname.normalize('  API.Example.COM  ')
// 'api.example.com'

Hostname.validate('api.example.com')
// { valid: true, errors: [] }
```

Invalid labels (e.g. leading/trailing dot or hyphen, label &gt; 63 chars), invalid IDNA, or length outside range yield `false` / `null` / `{ valid: false, errors: [...] }`.

### Password

Validate against length and optional rules, get strength score, or generate a random password.

```typescript
import { Password } from '@neabyte/auth-core'

// Validate with optional require* rules
Password.isValid('p4ssW0rd!', {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecial: true
})
// true

// Detailed validation result with error messages
Password.validate('short', { minLength: 8 })
// { valid: false, errors: ['Password must be at least 8 characters', ...] }

// Strength category and score (0–100)
Password.strength('p4ssW0rd!')
// { category: 'strong', score: 85 }

// Generate random password satisfying options (length capped at 1024)
Password.generate({ minLength: 12, requireUppercase: true, requireDigit: true })
// e.g. 'Kx7mNp2Qw9Lb'
```

### Username

Validate format (letters, numbers, underscore), normalize (trim and lowercase), or get detailed errors.

```typescript
import { Username } from '@neabyte/auth-core'

Username.isValid('jane_doe')
// true

Username.normalize('  Jane_Doe  ')
// 'jane_doe'

Username.validate('ab', { minLength: 3, maxLength: 32 })
// { valid: false, errors: ['Username must be at least 3 characters', ...] }
```

With custom length options:

```typescript
Username.isValid('ab', { minLength: 2, maxLength: 5 })
// true

Username.normalize('  ab  ', { minLength: 2, maxLength: 32 })
// 'ab'
```

### Utils

Shared helpers for validation, string normalization, and crypto random. Static-only; do not instantiate.

```typescript
import { Utils } from '@neabyte/auth-core'

Utils.collapseSpaces('  a   b  ')
// 'a b'

Utils.toTitleCase('jane doe')
// 'Jane Doe'

Utils.isString(value)
// type guard: value is string

Utils.lengthErrors(value, min, max, 'Label')
// ['Label must be at least N characters', ...]

Utils.resolveMinMax(options, { minLength: 2, maxLength: 128 })
// { minLength, maxLength } or null

Utils.randomInRange(1, 6)
// crypto random integer in range

Utils.toValidationResult(errors)
// { valid: errors.length === 0, errors }
```

## Modules Feature List

| Method                       | Category | Description                                                             |
| :--------------------------- | :------- | :---------------------------------------------------------------------- |
| `Cipher.decrypt`             | Cipher   | Decrypts base64url payload; returns plaintext or null if invalid.       |
| `Cipher.encrypt`             | Cipher   | Encrypts plaintext with shared secret; returns base64url string.        |
| `Email.getDomain`            | Email    | Extracts domain part (lowercased).                                      |
| `Email.getLocalPart`         | Email    | Extracts local part (before `@`). No `Email.validate()`; use `isValid`. |
| `Email.isValid`              | Email    | Returns true when email format and length are valid.                    |
| `Email.normalize`            | Email    | Trims and lowercases domain; optional local lowercasing.                |
| `Fullname.isValid`           | Fullname | Returns true when fullname length and allowed characters are valid.     |
| `Fullname.normalize`         | Fullname | Trims, collapses spaces, optional title-case; returns null if invalid.  |
| `Fullname.validate`          | Fullname | Returns `{ valid, errors }` with detailed messages.                     |
| `Hostname.isValid`           | Hostname | Returns true when hostname is valid DNS (e.g. for SNI).                 |
| `Hostname.normalize`         | Hostname | Trims and lowercases; returns null if invalid.                          |
| `Hostname.validate`          | Hostname | Returns `{ valid, errors }` with detailed messages.                     |
| `Password.generate`          | Password | Generates random password satisfying options.                           |
| `Password.isValid`           | Password | Returns true when password meets length and require\* rules.            |
| `Password.strength`          | Password | Returns `{ category, score }` for strength (weak/medium/strong).        |
| `Password.validate`          | Password | Returns `{ valid, errors }` with detailed messages.                     |
| `Username.isValid`           | Username | Returns true when length and pattern (letters, numbers, \_) are valid.  |
| `Username.normalize`         | Username | Trims and lowercases; returns null if invalid.                          |
| `Username.validate`          | Username | Returns `{ valid, errors }` with detailed messages.                     |
| `Utils.collapseSpaces`       | Utils    | Trims and collapses runs of spaces to one.                              |
| `Utils.invalidOptionsResult` | Utils    | Returns { valid: false, errors: ['Invalid … length options'] }.         |
| `Utils.isNonNegativeFinite`  | Utils    | Returns true when number is finite and non-negative.                    |
| `Utils.isValidMinMax`        | Utils    | Returns true when min ≤ max and both finite and non-negative.           |
| `Utils.isString`             | Utils    | Type guard: true if value is string.                                    |
| `Utils.lengthErrors`         | Utils    | Builds length error messages for min/max and label.                     |
| `Utils.notStringResult`      | Utils    | Returns { valid: false, errors: ['… must be a string'] }.               |
| `Utils.randomInRange`        | Utils    | Crypto random integer in [min, max] inclusive.                          |
| `Utils.randomUint32`         | Utils    | One random uint32 from crypto (0 to 2^32−1).                            |
| `Utils.resolveMinMax`        | Utils    | Resolves min/max from options and defaults; null if invalid.            |
| `Utils.toTitleCase`          | Utils    | Title-cases each word (first char upper, rest lower).                   |
| `Utils.toValidationResult`   | Utils    | Builds `{ valid, errors }` from error array.                            |

## API Reference

### Cipher.decrypt

```typescript
Cipher.decrypt(encryptedBase64Url, secret)
```

- `encryptedBase64Url` `<string>`: Output from `Cipher.encrypt()`.
- `secret` `<string>`: Shared secret used to encrypt.
- Returns: `Promise<string | null>`
- Description: Decrypts payload. Returns plaintext or null when secret is wrong, payload is corrupted, or input is invalid.

### Cipher.encrypt

```typescript
Cipher.encrypt(plaintext, secret)
```

- `plaintext` `<string>`: String to encrypt.
- `secret` `<string>`: Shared secret (e.g. API key); same secret required for decrypt.
- Returns: `Promise<string>`
- Description: Encrypts with AES-256-GCM; random salt and IV per call. Returns base64url string safe for URLs.

### Email.getDomain

```typescript
Email.getDomain(email)
```

- `email` `<string>`: Email string.
- Returns: `string | null`
- Description: Extracts domain part (lowercased). Returns null if invalid.

### Email.getLocalPart

```typescript
Email.getLocalPart(email)
```

- `email` `<string>`: Email string.
- Returns: `string | null`
- Description: Extracts local part (before `@`). Returns null if invalid.

### Email.isValid

```typescript
Email.isValid(email, options?)
```

- `email` `<string>`: Email string to validate.
- `options` `<EmailOptions>`: (Optional) Override default length limits and flags: `maxLength`, `localPartMaxLength`, `domainMaxLength`, `allowDisplayName`, `allowInternational`. Defaults to `{}`.
- Returns: `boolean`
- Description: Returns true when format and length are valid.

### Email.normalize

```typescript
Email.normalize(email, options?)
```

- `email` `<string>`: Email string to normalize.
- `options` `<NormalizeEmailOptions>`: (Optional) e.g. `{ lowercaseLocal: true }`. Defaults to `{}`.
- Returns: `string | null`
- Description: Trims and lowercases domain; optional local lowercasing. Returns null if invalid.

### Fullname.isValid

```typescript
Fullname.isValid(fullname, options?)
```

- `fullname` `<string>`: Full name string to validate.
- `options` `<FullnameOptions>`: (Optional) minLength, maxLength, allowDigits, titleCase (only affects normalize). Defaults to `{}`.
- Returns: `boolean`
- Description: Returns true when length and allowed characters (letters, spaces, hyphen, apostrophe; optionally digits) are valid and at least one letter is present.

### Fullname.normalize

```typescript
Fullname.normalize(fullname, options?)
```

- `fullname` `<string>`: Full name string to normalize.
- `options` `<FullnameOptions>`: (Optional) minLength, maxLength, allowDigits, titleCase. Defaults to `{}`.
- Returns: `string | null`
- Description: Trims, collapses multiple spaces to one, and applies title-case per word by default. Returns null if invalid.

### Fullname.validate

```typescript
Fullname.validate(fullname, options?)
```

- `fullname` `<string>`: Full name string to validate.
- `options` `<FullnameOptions>`: (Optional) minLength, maxLength, allowDigits, titleCase (only affects normalize). Defaults to `{}`.
- Returns: `FullnameResult` (`{ valid: boolean, errors: string[] }`)
- Description: Returns validation result with list of error messages.

### Hostname.isValid

```typescript
Hostname.isValid(hostname, options?)
```

- `hostname` `<string>`: Hostname string to validate (e.g. for SNI).
- `options` `<HostnameOptions>`: (Optional) minLength and maxLength. Defaults to `{}`. Effective length defaults are 1–253.
- Returns: `boolean`
- Description: Returns true when hostname is valid per RFC 1035/1123 (labels 1–63 chars, no leading/trailing dot; IDNA validated when present).

### Hostname.normalize

```typescript
Hostname.normalize(hostname, options?)
```

- `hostname` `<string>`: Hostname string to normalize.
- `options` `<HostnameOptions>`: (Optional) minLength and maxLength. Defaults to `{}`. Effective length defaults are 1–253.
- Returns: `string | null`
- Description: Trims and lowercases. Returns null if invalid.

### Hostname.validate

```typescript
Hostname.validate(hostname, options?)
```

- `hostname` `<string>`: Hostname string to validate.
- `options` `<HostnameOptions>`: (Optional) minLength and maxLength. Defaults to `{}`. Effective length defaults are 1–253.
- Returns: `HostnameResult` (`{ valid: boolean, errors: string[] }`)
- Description: Returns validation result with list of error messages.

### Password.generate

```typescript
Password.generate(options?)
```

- `options` `<PasswordOptions>`: (Optional) Length and require\* rules. Defaults to `{}`.
- Returns: `string`
- Description: Generates random password satisfying the given options. Generated length is capped at 1024.

### Password.isValid

```typescript
Password.isValid(password, options?)
```

- `password` `<string>`: Password string to validate.
- `options` `<PasswordOptions>`: (Optional) Length and require\* rules. Defaults to `{}`.
- Returns: `boolean`
- Description: Returns true when length and all enabled require\* rules are satisfied.

### Password.validate

```typescript
Password.validate(password, options?)
```

- `password` `<string>`: Password string to validate.
- `options` `<PasswordOptions>`: (Optional) Length and require\* rules. Defaults to `{}`.
- Returns: `PasswordResult` (`{ valid: boolean, errors: string[] }`)
- Description: Returns validation result with list of error messages.

### Password.strength

```typescript
Password.strength(password)
```

- `password` `<string>`: Password string to score.
- Returns: `PasswordStrengthResult` (`{ category: 'weak' | 'medium' | 'strong', score: number }`)
- Description: Returns strength category and numeric score (0–100). Empty or non-string input returns `{ category: 'weak', score: 0 }`.

### Username.isValid

```typescript
Username.isValid(username, options?)
```

- `username` `<string>`: Username string to validate.
- `options` `<UsernameOptions>`: (Optional) minLength and maxLength. Defaults to `{}`.
- Returns: `boolean`
- Description: Returns true when length and pattern (letters, numbers, underscore) are valid.

### Username.normalize

```typescript
Username.normalize(username, options?)
```

- `username` `<string>`: Username string to normalize.
- `options` `<UsernameOptions>`: (Optional) minLength and maxLength. Defaults to `{}`.
- Returns: `string | null`
- Description: Trims and lowercases. Returns null if invalid.

### Username.validate

```typescript
Username.validate(username, options?)
```

- `username` `<string>`: Username string to validate.
- `options` `<UsernameOptions>`: (Optional) minLength and maxLength. Defaults to `{}`.
- Returns: `UsernameResult` (`{ valid: boolean, errors: string[] }`)
- Description: Returns validation result with list of error messages.

### Utils.collapseSpaces

```typescript
Utils.collapseSpaces(value)
```

- `value` `<string>`: String to normalize.
- Returns: `string`
- Description: Trims and collapses runs of spaces to one.

### Utils.invalidOptionsResult

```typescript
Utils.invalidOptionsResult(label)
```

- `label` `<string>`: Field name (e.g. fullname, hostname).
- Returns: `ValidationResult`
- Description: Returns { valid: false, errors: ['Invalid … length options'] }.

### Utils.isNonNegativeFinite

```typescript
Utils.isNonNegativeFinite(n)
```

- `n` `<number>`: Value to check.
- Returns: `boolean`
- Description: Returns true when finite and non-negative.

### Utils.isValidMinMax

```typescript
Utils.isValidMinMax(min, max)
```

- `min` `<number>`: Minimum value.
- `max` `<number>`: Maximum value.
- Returns: `boolean`
- Description: Returns true when min ≤ max and both are finite and non-negative.

### Utils.isString

```typescript
Utils.isString(value)
```

- `value` `<unknown>`: Value to check.
- Returns: `value is string`
- Description: Type guard; returns true when value is a string.

### Utils.lengthErrors

```typescript
Utils.lengthErrors(value, min, max, label)
```

- `value` `<string>`: String to check.
- `min` `<number>`: Minimum length.
- `max` `<number>`: Maximum length.
- `label` `<string>`: Label for error messages.
- Returns: `string[]`
- Description: Builds error messages for too short or too long.

### Utils.notStringResult

```typescript
Utils.notStringResult(label)
```

- `label` `<string>`: Field name (e.g. Fullname, Hostname).
- Returns: `ValidationResult`
- Description: Returns { valid: false, errors: ['… must be a string'] }.

### Utils.randomInRange

```typescript
Utils.randomInRange(min, max)
```

- `min` `<number>`: Minimum value (inclusive).
- `max` `<number>`: Maximum value (inclusive).
- Returns: `number`
- Description: Crypto random integer in [min, max].

### Utils.randomUint32

```typescript
Utils.randomUint32()
```

- Returns: `number`
- Description: One random uint32 from crypto (0 to 2^32−1).

### Utils.resolveMinMax

```typescript
Utils.resolveMinMax(options, defaults)
```

- `options` `<MinMaxOptions>`: Optional minLength and maxLength.
- `defaults` `<ResolvedMinMax>`: Default min and max length.
- Returns: `ResolvedMinMax | null`
- Description: Resolves min/max from options and defaults. Returns null if invalid range.

### Utils.toTitleCase

```typescript
Utils.toTitleCase(value)
```

- `value` `<string>`: String to transform.
- Returns: `string`
- Description: Title-cases each word (first char upper, rest lower).

### Utils.toValidationResult

```typescript
Utils.toValidationResult(errors)
```

- `errors` `<string[]>`: Error messages.
- Returns: `ValidationResult` (`{ valid: boolean, errors: string[] }`)
- Description: Builds result with valid = (errors.length === 0).

## Build & Test

From the repo root (requires [Deno](https://deno.com/)).

**Check** — format, lint, and typecheck source:

```bash
deno task check
```

**Unit tests** — format/lint tests and run all tests:

```bash
deno task test
```

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for details.
