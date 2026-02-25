import type * as Types from '@app/Types.ts'

/**
 * Shared validation and resolution helpers.
 * @description Static-only; do not instantiate.
 */
export class Utils {
  /** Private constructor to prevent instantiation */
  private constructor() {}

  /**
   * Collapse whitespace runs to single space.
   * @description Trims and normalizes internal spaces.
   * @param value - String to normalize
   * @returns Trimmed string with single spaces
   */
  static collapseSpaces(value: string): string {
    return value.trim().replace(/\s+/g, ' ')
  }

  /**
   * Validation result for invalid length options.
   * @description Single error for invalid options.
   * @param label - Field name e.g. fullname hostname
   * @returns Result with valid false
   */
  static invalidOptionsResult(label: string): Types.ValidationResult {
    return { errors: [`Invalid ${label} length options`], valid: false }
  }

  /**
   * Check number finite and non-negative.
   * @description True if finite and non-negative.
   * @param n - Value to check
   * @returns True if finite and >= 0
   */
  static isNonNegativeFinite(n: number): boolean {
    return Number.isFinite(n) && n >= 0
  }

  /**
   * Type guard for string input.
   * @description True if value is string.
   * @param value - Value to check
   * @returns True if value is string
   */
  static isString(value: unknown): value is string {
    return typeof value === 'string'
  }

  /**
   * Check min and max valid numeric range.
   * @description True when min <= max and both finite.
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns True if valid range
   */
  static isValidMinMax(min: number, max: number): boolean {
    return Utils.isNonNegativeFinite(min) && Utils.isNonNegativeFinite(max) && min <= max
  }

  /**
   * Length error messages for value.
   * @description Builds messages for too short or long.
   * @param value - String to check
   * @param min - Minimum length
   * @param max - Maximum length
   * @param label - Label for messages
   * @returns Array of error messages
   */
  static lengthErrors(value: string, min: number, max: number, label: string): string[] {
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
   * Validation result for non-string value.
   * @description Single error for non-string input.
   * @param label - Field name e.g. Fullname Hostname
   * @returns Result with valid false
   */
  static notStringResult(label: string): Types.ValidationResult {
    return { errors: [`${label} must be a string`], valid: false }
  }

  /**
   * Crypto random integer in min-max range.
   * @description Uses randomUint32 for distribution.
   * @param min - Minimum value inclusive
   * @param max - Maximum value inclusive
   * @returns Integer in range
   */
  static randomInRange(min: number, max: number): number {
    if (max <= min) {
      return min
    }
    const span = max - min + 1
    const rand = Utils.randomUint32()
    return min + Math.floor((span * rand) / 2 ** 32)
  }

  /**
   * One random uint32 from crypto.
   * @description Single uint32 from secure random.
   * @returns Random 0 to 2^32-1
   */
  static randomUint32(): number {
    return crypto.getRandomValues(new Uint32Array(1))[0] ?? 0
  }

  /**
   * Resolve min and max from options.
   * @description Applies defaults and validates range.
   * @param options - User options optional min max length
   * @param defaults - Default min and max length
   * @returns Resolved range or null
   */
  static resolveMinMax(
    options: Types.MinMaxOptions,
    defaults: Types.ResolvedMinMax
  ): Types.ResolvedMinMax | null {
    const minLength = options.minLength ?? defaults.minLength
    const maxLength = options.maxLength ?? defaults.maxLength
    if (!Utils.isValidMinMax(minLength, maxLength)) {
      return null
    }
    return { minLength, maxLength }
  }

  /**
   * Title-cases each word in string.
   * @description First char upper rest lower per word.
   * @param value - String to transform
   * @returns Title-cased string
   */
  static toTitleCase(value: string): string {
    return value
      .split(' ')
      .map((word) => {
        const first = word.charAt(0)
        return first === '' ? word : first.toUpperCase() + word.slice(1).toLowerCase()
      })
      .join(' ')
  }

  /**
   * Build validation result from errors array.
   * @description Object with valid flag and errors.
   * @param errors - Error messages
   * @returns Object with valid flag and errors
   */
  static toValidationResult(errors: string[]): Types.ValidationResult {
    return { errors, valid: errors.length === 0 }
  }
}
