import type * as Types from '@app/Types.ts'
import { Utils } from '@app/index.ts'

/**
 * Fullname validation and normalization.
 * @description Conservative name subset per RFC 6350 and 7700.
 */
export class Fullname {
  /** Private constructor to prevent instantiation */
  private constructor() {}
  /** Default max fullname length */
  static readonly defaultMaxLength = 128
  /** Default minimum fullname length. */
  static readonly defaultMinLength = 2
  /** Default resolved options for invalid input */
  static readonly defaultResolvedOptions: Types.ResolvedFullnameOptions = {
    allowDigits: false,
    maxLength: 128,
    minLength: 2,
    titleCase: true
  }
  /** Pattern: letters, space, hyphen, apostrophe */
  static readonly fullnameRegexBase = /^[\p{L}\s\-']+$/u
  /** Pattern with digits when allowDigits */
  static readonly fullnameRegexWithDigits = /^[\p{L}0-9\s\-']+$/u
  /** At least one letter required */
  static readonly hasLetterRegex = /\p{L}/u

  /**
   * Check fullname valid per options.
   * @description Delegates to validate and returns valid flag.
   * @param fullname - Raw fullname string
   * @param options - Optional min/max length and rules
   * @returns True if valid
   */
  static isValid(fullname: string, options: Types.FullnameOptions = {}): boolean {
    return Fullname.validate(fullname, options).valid
  }

  /**
   * Normalize fullname per options.
   * @description Collapses spaces, optional title-case; null if invalid.
   * @param fullname - Raw fullname string
   * @param options - Optional length and titleCase
   * @returns Normalized string or null
   */
  static normalize(fullname: string, options: Types.FullnameOptions = {}): string | null {
    if (!Utils.isString(fullname)) {
      return null
    }
    const collapsed = Utils.collapseSpaces(fullname)
    const resolvedOptions = Fullname.resolveOptions(options) ?? Fullname.defaultResolvedOptions
    const errors = Fullname.runChecks(collapsed, resolvedOptions)
    if (errors.length > 0) {
      return null
    }
    return resolvedOptions.titleCase ? Utils.toTitleCase(collapsed) : collapsed
  }

  /**
   * Validate fullname and return result.
   * @description Runs length and pattern checks; returns errors.
   * @param fullname - Raw fullname string
   * @param options - Optional length and character rules
   * @returns FullnameResult with valid and errors
   */
  static validate(fullname: string, options: Types.FullnameOptions = {}): Types.FullnameResult {
    if (!Utils.isString(fullname)) {
      return Utils.notStringResult('Fullname')
    }
    const collapsed = Utils.collapseSpaces(fullname)
    const resolvedOptions = Fullname.resolveOptions(options)
    if (resolvedOptions === null) {
      return Utils.invalidOptionsResult('fullname')
    }
    const errors = Fullname.runChecks(collapsed, resolvedOptions)
    return Utils.toValidationResult(errors)
  }

  /**
   * Resolve fullname options with defaults.
   * @description Validates min/max range and booleans.
   * @param options - User fullname options
   * @returns Resolved options or null if invalid
   */
  private static resolveOptions(
    options: Types.FullnameOptions
  ): Types.ResolvedFullnameOptions | null {
    const range = Utils.resolveMinMax(options, {
      minLength: Fullname.defaultMinLength,
      maxLength: Fullname.defaultMaxLength
    })
    if (range === null) {
      return null
    }
    return {
      ...range,
      allowDigits: options.allowDigits === true,
      titleCase: options.titleCase !== false
    }
  }

  /**
   * Run length and pattern checks.
   * @description Pushes length and regex errors to array.
   * @param normalized - Collapsed fullname string
   * @param resolvedOptions - Resolved min/max and rules
   * @returns Array of error messages
   */
  private static runChecks(
    normalized: string,
    resolvedOptions: Types.ResolvedFullnameOptions
  ): string[] {
    const errors = Utils.lengthErrors(
      normalized,
      resolvedOptions.minLength,
      resolvedOptions.maxLength,
      'Fullname'
    )
    const regex = resolvedOptions.allowDigits
      ? Fullname.fullnameRegexWithDigits
      : Fullname.fullnameRegexBase
    if (!regex.test(normalized)) {
      errors.push(
        resolvedOptions.allowDigits
          ? 'Fullname must contain only letters, digits, spaces, hyphen, and apostrophe'
          : 'Fullname must contain only letters, spaces, hyphen, and apostrophe'
      )
    } else if (!Fullname.hasLetterRegex.test(normalized)) {
      errors.push('Fullname must contain at least one letter')
    }
    return errors
  }
}
