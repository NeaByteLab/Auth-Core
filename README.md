<div align="center">

# Auth Core

Auth validation, normalization, and generation for the Deno runtime.

[![Module type: Deno/ESM](https://img.shields.io/badge/module%20type-deno%2Fesm-brightgreen)](https://github.com/NeaByteLab/Auth-Core) [![JSR](https://jsr.io/badges/@neabyte/auth-core)](https://jsr.io/@neabyte/auth-core) [![CI](https://github.com/NeaByteLab/Auth-Core/actions/workflows/ci.yaml/badge.svg)](https://github.com/NeaByteLab/Auth-Core/actions/workflows/ci.yaml) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

## Features

- **Cipher** — AES-256-GCM encrypt/decrypt with shared secret (PBKDF2, base64url).
- **Email** — Format validation, normalize, get domain/local part; optional display name and international.
- **Fullname** — Letters, space, hyphen, apostrophe (subset aligned with RFC 6350/7700); optional digits and title-case.
- **Hostname** — SNI/DNS (subset aligned with RFC 1035, 1123); trim and lowercase.
- **Password** — Length and optional rules; strength score; random generate.
- **Username** — Letters, numbers, underscore; trim and lowercase.

## Installation

> [!IMPORTANT]
> **Prerequisites:** [Deno](https://deno.com/) installed.

```bash
deno add jsr:@neabyte/auth-core
```

## Quick Start

Import the classes you need.

- Use `isValid()` for a quick boolean check
- `validate()` when you need `{ valid, errors }` (e.g. to show errors in a form)
- `normalize()` when you want a cleaned string to store or display, or `null` if invalid.

```typescript
import { Email, Password, Username } from '@neabyte/auth-core'

Email.isValid('john@doe.com')
// true

Password.validate('short', { minLength: 8 })
// { valid: false, errors: ['Password must be at least 8 characters'] }

Username.normalize('  Jane_Doe  ')
// 'jane_doe'
```

> [!NOTE]
> More details: [USAGE.md](USAGE.md)

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

Tests live under `tests/` (one file per module).

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for details.
