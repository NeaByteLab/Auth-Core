import type * as Types from '@app/Types.ts'
import { Utils } from '@app/index.ts'

/**
 * PIN validation and normalization.
 * @description Digits only; length per options (e.g. 4–8).
 */
export class Pin {
  /** Prevents direct instantiation. */
  private constructor() {}
  /** Default maximum PIN length. */
  static readonly defaultMaxLength = 8
  /** Default minimum PIN length. */
  static readonly defaultMinLength = 4
  /** Resolved default min/max length options. */
  static readonly defaultResolvedOptions: Types.ResolvedPinOptions = {
    maxLength: 8,
    minLength: 4
  }
  /** Digits-only pattern. */
  static readonly pinRegex = /^[0-9]+$/

  /**
   * Check PIN valid per options.
   * @description Delegates to validate, returns valid flag.
   * @param pin - PIN string
   * @param options - Optional min/max length
   * @returns True if valid
   */
  static isValid(pin: string, options: Types.PinOptions = {}): boolean {
    return Pin.validate(pin, options).valid
  }

  /**
   * Normalize PIN (trim only).
   * @description Returns null when validation fails.
   * @param pin - PIN string
   * @param options - Optional min/max length
   * @returns Trimmed PIN or null
   */
  static normalize(pin: string, options: Types.PinOptions = {}): string | null {
    if (!Utils.isString(pin)) {
      return null
    }
    const trimmed = pin.trim()
    const resolvedOptions = Pin.resolveOptions(options) ?? Pin.defaultResolvedOptions
    const errors = Pin.runChecks(trimmed, resolvedOptions)
    if (errors.length > 0) {
      return null
    }
    return trimmed
  }
  /**
   * Validate PIN and return result.
   * @description Runs length and digit-only checks.
   * @param pin - PIN string
   * @param options - Optional min/max length
   * @returns PinResult with valid flag and errors
   */
  static validate(pin: string, options: Types.PinOptions = {}): Types.PinResult {
    if (!Utils.isString(pin)) {
      return Utils.notStringResult('PIN')
    }
    const trimmed = pin.trim()
    const resolvedOptions = Pin.resolveOptions(options)
    if (resolvedOptions === null) {
      return Utils.invalidOptionsResult('pin')
    }
    const errors = Pin.runChecks(trimmed, resolvedOptions)
    return Utils.toValidationResult(errors)
  }

  /**
   * Resolve PIN options with defaults.
   * @description Validates min/max range.
   * @param options - User PIN options
   * @returns Resolved options or null when invalid
   */
  private static resolveOptions(options: Types.PinOptions): Types.ResolvedPinOptions | null {
    const range = Utils.resolveMinMax(options, {
      minLength: Pin.defaultMinLength,
      maxLength: Pin.defaultMaxLength
    })
    if (range === null) {
      return null
    }
    return { ...range }
  }

  /**
   * Run length and pattern checks.
   * @description Pushes length and digit-only errors.
   * @param pin - Trimmed PIN string
   * @param resolvedOptions - Resolved min/max
   * @returns Array of error messages
   */
  private static runChecks(pin: string, resolvedOptions: Types.ResolvedPinOptions): string[] {
    const errors = Utils.lengthErrors(
      pin,
      resolvedOptions.minLength,
      resolvedOptions.maxLength,
      'PIN'
    )
    if (!Pin.pinRegex.test(pin)) {
      errors.push('PIN must contain only digits')
    }
    return errors
  }
}
