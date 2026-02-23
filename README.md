# Auth-Core [![Module type: Deno/ESM](https://img.shields.io/badge/module%20type-deno%2Fesm-brightgreen)](https://github.com/NeaByteLab/Auth-Core) [![JSR](https://jsr.io/badges/@neabyte/auth-core)](https://jsr.io/@neabyte/auth-core) [![CI](https://github.com/NeaByteLab/Auth-Core/actions/workflows/ci.yaml/badge.svg)](https://github.com/NeaByteLab/Auth-Core/actions/workflows/ci.yaml) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Auth validation, normalization, and generation for the Deno runtime.

## Installation

This module is available on JSR. Add it to your Deno project:

```bash
deno add jsr:@neabyte/auth-core
```

## Usage

### Email

Validate format, normalize, and extract domain or local part. Options override defaults.

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
// { category: 'strong', score: 100 }

// Generate random password satisfying options
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

## Modules Feature List

| Method               | Category | Description                                                            |
| :------------------- | :------- | :--------------------------------------------------------------------- |
| `Email.isValid`      | Email    | Returns true when email format and length are valid.                   |
| `Email.normalize`    | Email    | Trims and lowercases domain; optional local lowercasing.               |
| `Email.getDomain`    | Email    | Extracts domain part (lowercased).                                     |
| `Email.getLocalPart` | Email    | Extracts local part (before `@`).                                      |
| `Password.isValid`   | Password | Returns true when password meets length and require\* rules.           |
| `Password.validate`  | Password | Returns `{ valid, errors }` with detailed messages.                    |
| `Password.strength`  | Password | Returns `{ category, score }` for strength (weak/medium/strong).       |
| `Password.generate`  | Password | Generates random password satisfying options.                          |
| `Username.isValid`   | Username | Returns true when length and pattern (letters, numbers, \_) are valid. |
| `Username.normalize` | Username | Trims and lowercases; returns null if invalid.                         |
| `Username.validate`  | Username | Returns `{ valid, errors }` with detailed messages.                    |

## API Reference

### Email.isValid

```typescript
Email.isValid(email, options?)
```

- `email` `<string>`: Email string to validate.
- `options` `<EmailOptions>`: (Optional) Override default length limits and flags. Defaults to `{}`.
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
- Description: Returns strength category and numeric score (0–100).

### Password.generate

```typescript
Password.generate(options?)
```

- `options` `<PasswordOptions>`: (Optional) Length and require\* rules. Defaults to `{}`.
- Returns: `string`
- Description: Generates random password satisfying the given options.

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

## Option Types

**EmailOptions** (optional): `maxLength` (default 254), `localPartMaxLength` (64), `domainMaxLength` (253), `allowDisplayName` (false), `allowInternational` (false).

**NormalizeEmailOptions** (optional): `lowercaseLocal` (false).

**PasswordOptions** (optional): `minLength` (8), `maxLength` (128), `requireUppercase`, `requireLowercase`, `requireDigit`, `requireSpecial` (all default false).

**UsernameOptions** (optional): `minLength` (3), `maxLength` (32).

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for details.
