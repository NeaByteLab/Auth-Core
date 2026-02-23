import type * as Types from '@app/Types.ts'
import * as Utils from '@app/Utils.ts'

/** Default maximum username length */
const defaultMaxLength = 32
/** Default minimum username length */
const defaultMinLength = 3
/** Default resolved options when user options are invalid */
const defaultResolvedOptions: Types.ResolvedUsernameOptions = {
  maxLength: defaultMaxLength,
  minLength: defaultMinLength
}
/** Pattern: letters, digits, underscore only */
const usernameRegex = /^[a-zA-Z0-9_]+$/

/**
 * Resolves username options.
 * @description Merges with defaults or null.
 * @param options - User options
 * @returns Resolved options or null
 */
function resolveOptions(options: Types.UsernameOptions): Types.ResolvedUsernameOptions | null {
  const range = Utils.resolveMinMax(options, {
    minLength: defaultMinLength,
    maxLength: defaultMaxLength
  })
  if (range === null) {
    return null
  }
  return { ...range }
}

/**
 * Runs checks and returns errors.
 * @description Length and pattern error messages.
 * @param username - Trimmed username to check
 * @param resolvedOptions - Resolved options
 * @returns Error messages
 */
function runChecks(username: string, resolvedOptions: Types.ResolvedUsernameOptions): string[] {
  const errors = Utils.lengthErrors(
    username,
    resolvedOptions.minLength,
    resolvedOptions.maxLength,
    'Username'
  )
  if (!usernameRegex.test(username)) {
    errors.push('Username must contain only letters, numbers, and underscore')
  }
  return errors
}

/**
 * Username validation and normalization.
 * @description Validates length pattern normalizes trim case.
 */
export default class Username {
  /**
   * Checks username valid.
   * @description True when validate returns valid.
   * @param username - String to validate
   * @param options - Optional length rules
   * @returns True if valid
   */
  static isValid(username: string, options: Types.UsernameOptions = {}): boolean {
    return Username.validate(username, options).valid
  }

  /**
   * Normalizes username string.
   * @description Trimmed lowercased or null if invalid.
   * @param username - Username string
   * @param options - Optional length rules
   * @returns Trimmed lowercased or null
   */
  static normalize(username: string, options: Types.UsernameOptions = {}): string | null {
    if (!Utils.isString(username)) {
      return null
    }
    const trimmed = username.trim()
    const resolvedOptions = resolveOptions(options) ?? defaultResolvedOptions
    const errors = runChecks(trimmed, resolvedOptions)
    if (errors.length > 0) {
      return null
    }
    return trimmed.toLowerCase()
  }

  /**
   * Validates username against rules.
   * @description Valid flag and errors array.
   * @param username - String to validate
   * @param options - Optional length rules
   * @returns Valid flag and errors
   */
  static validate(username: string, options: Types.UsernameOptions = {}): Types.UsernameResult {
    if (!Utils.isString(username)) {
      return { errors: ['Username must be a string'], valid: false }
    }
    const trimmed = username.trim()
    const resolvedOptions = resolveOptions(options)
    if (resolvedOptions === null) {
      return { errors: ['Invalid username length options'], valid: false }
    }
    const errors = runChecks(trimmed, resolvedOptions)
    return Utils.toValidationResult(errors)
  }
}
