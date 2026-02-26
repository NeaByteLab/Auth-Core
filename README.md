<div align="center">

# Auth Core

Auth validation, normalization, and generation for modern runtimes.

[![Module type: Deno/ESM](https://img.shields.io/badge/module%20type-deno%2Fesm-brightgreen)](https://github.com/NeaByteLab/Auth-Core) [![npm version](https://img.shields.io/npm/v/@neabyte/auth-core.svg)](https://www.npmjs.org/package/@neabyte/auth-core) [![JSR](https://jsr.io/badges/@neabyte/auth-core)](https://jsr.io/@neabyte/auth-core) [![CI](https://github.com/NeaByteLab/Auth-Core/actions/workflows/ci.yaml/badge.svg)](https://github.com/NeaByteLab/Auth-Core/actions/workflows/ci.yaml) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

## Features

- **Cipher** — Encrypt and decrypt with a shared secret; URL-safe output.
- **Email** — Validate, normalize, and extract domain or local part.
- **Fullname** — Validate and normalize human names with optional formatting.
- **Hostname** — Validate and normalize hostnames (e.g. for TLS or DNS).
- **Password** — Validate rules, score strength, or generate random passwords.
- **Pin** — Validate and normalize numeric PINs (e.g. 4–8 digits).
- **Username** — Validate and normalize usernames (letters, numbers, underscore).

## Installation

### Deno

```bash
deno add jsr:@neabyte/auth-core
```

### npm

```bash
npm install @neabyte/auth-core
```

### CDN (browser / any ESM)

```html
<script type="module">
  import { Email, Password, Username } from 'https://esm.sh/@neabyte/auth-core'
  // or pin version: .../auth-core@x.x.x
</script>
```

- Latest: `https://esm.sh/@neabyte/auth-core`
- Pinned: `https://esm.sh/@neabyte/auth-core@<version>`

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
> TypeScript types (e.g. `PinResult`, `PasswordOptions`) are exported. More details: [USAGE.md](USAGE.md)

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
