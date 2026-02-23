import type * as Types from '@app/Types.ts'

/**
 * Checks number finite and non-negative.
 * @description True if finite and non-negative.
 * @param n - Value to check
 * @returns True if finite and >= 0
 */
export function isNonNegativeFinite(n: number): boolean {
  return Number.isFinite(n) && n >= 0
}

/**
 * Type guard for string input.
 * @description True if value is string.
 * @param value - Value to check
 * @returns True if value is string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Checks min max valid numeric range.
 * @description True when min <= max and both finite.
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns True if valid range
 */
export function isValidMinMax(min: number, max: number): boolean {
  return isNonNegativeFinite(min) && isNonNegativeFinite(max) && min <= max
}

/**
 * Returns length error messages for value.
 * @description Builds messages for too short or long.
 * @param value - String to check
 * @param min - Minimum length
 * @param max - Maximum length
 * @param label - Label for messages
 * @returns Array of error messages
 */
export function lengthErrors(value: string, min: number, max: number, label: string): string[] {
  const errors: string[] = []
  if (value.length < min) {
    errors.push(`${label} must be at least ${min} characters`)
  }
  if (value.length > max) {
    errors.push(`${label} must be at most ${max} characters`)
  }
  return errors
}

/**
 * Returns one random uint32 from crypto.
 * @description Single uint32 from secure random.
 * @returns Random 0 to 2^32-1
 */
export function randomUint32(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 0
}

/**
 * Resolves min max from options defaults.
 * @description Applies defaults and validates range.
 * @param options - User options optional min max length
 * @param defaults - Default min and max length
 * @returns Resolved range or null
 */
export function resolveMinMax(
  options: Types.MinMaxOptions,
  defaults: Types.ResolvedMinMax
): Types.ResolvedMinMax | null {
  const minLength = options.minLength ?? defaults.minLength
  const maxLength = options.maxLength ?? defaults.maxLength
  if (!isValidMinMax(minLength, maxLength)) {
    return null
  }
  return { minLength, maxLength }
}

/**
 * Builds validation result from errors array.
 * @description Object with valid flag and errors.
 * @param errors - Error messages
 * @returns Object with valid flag and errors
 */
export function toValidationResult(errors: string[]): Types.ValidationResult {
  return { errors, valid: errors.length === 0 }
}
