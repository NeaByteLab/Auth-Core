import type * as Types from '@app/Types.ts'
import { Utils } from '@app/index.ts'

/**
 * Username validation and normalization.
 * @description Validates length and pattern, normalizes trim and case.
 */
export class Username {
  /** Private constructor to prevent instantiation */
  private constructor() {}
  /** Default maximum username length */
  static readonly defaultMaxLength = 32
  /** Default minimum username length */
  static readonly defaultMinLength = 3
  /** Default resolved options for invalid input */
  static readonly defaultResolvedOptions: Types.ResolvedUsernameOptions = {
    maxLength: 32,
    minLength: 3
  }
  /** Pattern: letters, digits, underscore only */
  static readonly usernameRegex = /^[a-zA-Z0-9_]+$/

  /**
   * Check username valid per options.
   * @description Delegates to validate and returns valid flag.
   * @param username - Username string
   * @param options - Optional min/max length
   * @returns True if valid
   */
  static isValid(username: string, options: Types.UsernameOptions = {}): boolean {
    return Username.validate(username, options).valid
  }

  /**
   * Normalize username trim and lowercase.
   * @description Returns null if validation fails.
   * @param username - Username string
   * @param options - Optional min/max length
   * @returns Normalized string or null
   */
  static normalize(username: string, options: Types.UsernameOptions = {}): string | null {
    if (!Utils.isString(username)) {
      return null
    }
    const trimmed = username.trim()
    const resolvedOptions = Username.resolveOptions(options) ?? Username.defaultResolvedOptions
    const errors = Username.runChecks(trimmed, resolvedOptions)
    if (errors.length > 0) {
      return null
    }
    return trimmed.toLowerCase()
  }

  /**
   * Validate username and return result.
   * @description Runs length and pattern checks.
   * @param username - Username string
   * @param options - Optional min/max length
   * @returns UsernameResult with valid and errors
   */
  static validate(username: string, options: Types.UsernameOptions = {}): Types.UsernameResult {
    if (!Utils.isString(username)) {
      return Utils.notStringResult('Username')
    }
    const trimmed = username.trim()
    const resolvedOptions = Username.resolveOptions(options)
    if (resolvedOptions === null) {
      return Utils.invalidOptionsResult('username')
    }
    const errors = Username.runChecks(trimmed, resolvedOptions)
    return Utils.toValidationResult(errors)
  }

  /**
   * Resolve username options with defaults.
   * @description Validates min/max range.
   * @param options - User username options
   * @returns Resolved options or null if invalid
   */
  private static resolveOptions(
    options: Types.UsernameOptions
  ): Types.ResolvedUsernameOptions | null {
    const range = Utils.resolveMinMax(options, {
      minLength: Username.defaultMinLength,
      maxLength: Username.defaultMaxLength
    })
    if (range === null) {
      return null
    }
    return { ...range }
  }

  /**
   * Run length and pattern checks.
   * @description Pushes length and regex errors to array.
   * @param username - Trimmed username string
   * @param resolvedOptions - Resolved min/max
   * @returns Array of error messages
   */
  private static runChecks(
    username: string,
    resolvedOptions: Types.ResolvedUsernameOptions
  ): string[] {
    const errors = Utils.lengthErrors(
      username,
      resolvedOptions.minLength,
      resolvedOptions.maxLength,
      'Username'
    )
    if (!Username.usernameRegex.test(username)) {
      errors.push('Username must contain only letters, numbers, and underscore')
    }
    return errors
  }
}
