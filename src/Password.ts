import type * as Types from '@app/Types.ts'
import { Utils } from '@app/index.ts'

/**
 * Password validation and generation.
 * @description Validates rules, scores strength, generates password.
 */
export class Password {
  /** Private constructor to prevent instantiation */
  private constructor() {}
  /** Default min and max password length. */
  static readonly defaultLengths = { minLength: 8, maxLength: 128 } as const
  /** Default resolved options for invalid input */
  static readonly defaultResolvedOptions: Types.ResolvedPasswordOptions = {
    maxLength: 128,
    minLength: 8,
    requireDigit: false,
    requireLowercase: false,
    requireSpecial: false,
    requireUppercase: false
  }
  /** Lowercase letters for generation */
  static readonly lowercaseLetters = 'abcdefghijklmnopqrstuvwxyz'
  /** Uppercase letters for generation */
  static readonly uppercaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  /** Digit characters for generation */
  static readonly digits = '0123456789'
  /** Special characters for generation */
  static readonly specialChars = '!@#$%^&*()_+-=[]{};\':"|,.<>/?'
  /** Regex matching one special character */
  static readonly specialRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/
  /** Requirement key to user-facing error message. */
  static readonly requirementMessages: Record<
    keyof Pick<
      Types.ResolvedPasswordOptions,
      'requireDigit' | 'requireLowercase' | 'requireSpecial' | 'requireUppercase'
    >,
    string
  > = {
    requireDigit: 'Password must contain at least one digit',
    requireLowercase: 'Password must contain at least one lowercase letter',
    requireSpecial: 'Password must contain at least one special character',
    requireUppercase: 'Password must contain at least one uppercase letter'
  }
  /** Char requirement and strength rules. */
  static readonly charRules = [
    {
      regex: /\d/,
      charSet: Password.digits,
      key: 'requireDigit' as const,
      strengthScore: 15
    },
    {
      regex: /[a-z]/,
      charSet: Password.lowercaseLetters,
      key: 'requireLowercase' as const,
      strengthScore: 15
    },
    {
      regex: Password.specialRegex,
      charSet: Password.specialChars,
      key: 'requireSpecial' as const,
      strengthScore: 20
    },
    {
      regex: /[A-Z]/,
      charSet: Password.uppercaseLetters,
      key: 'requireUppercase' as const,
      strengthScore: 15
    }
  ] as const

  /**
   * Generate random password per options.
   * @description Ensures required char sets; crypto random.
   * @param options - Optional length and requirements
   * @returns Generated password string
   */
  static generate(options: Types.PasswordOptions = {}): string {
    const resolvedOptions = Password.resolveOptions(options) ?? Password.defaultResolvedOptions
    const requiredCount = Password.charRules.filter((rule) => resolvedOptions[rule.key]).length
    const minLength = Math.max(requiredCount, resolvedOptions.minLength)
    const maxLength = Math.min(1024, resolvedOptions.maxLength)
    const length = Utils.randomInRange(minLength, maxLength)
    let charset = ''
    for (const { charSet, key } of Password.charRules) {
      if (resolvedOptions[key]) {
        charset += charSet
      }
    }
    if (charset.length === 0) {
      charset = `${Password.lowercaseLetters}${Password.uppercaseLetters}${Password.digits}`
    }
    const randomBytes = new Uint8Array(length)
    crypto.getRandomValues(randomBytes)
    let result = ''
    for (let index = 0; index < length; index++) {
      result += charset[(randomBytes[index] ?? 0) % charset.length]
    }
    for (const { regex, charSet, key } of Password.charRules) {
      if (resolvedOptions[key]) {
        result = Password.ensureOneChar(result, length, regex, charSet)
      }
    }
    return result
  }

  /**
   * Check password valid per options.
   * @description Delegates to validate and returns valid flag.
   * @param password - Password string
   * @param options - Optional length and requirements
   * @returns True if valid
   */
  static isValid(password: string, options: Types.PasswordOptions = {}): boolean {
    return Password.validate(password, options).valid
  }

  /**
   * Score password strength category and score.
   * @description Length and char-set contribution to score.
   * @param password - Password string
   * @returns PasswordStrengthResult with category and score
   */
  static strength(password: string): Types.PasswordStrengthResult {
    if (!Utils.isString(password) || password.length === 0) {
      return { category: 'weak', score: 0 }
    }
    let score = 0
    if (password.length >= 8) {
      score += 20
    }
    if (password.length >= 12) {
      score += 15
    }
    if (password.length >= 16) {
      score += 10
    }
    for (const { regex, strengthScore } of Password.charRules) {
      if (regex.test(password)) {
        score += strengthScore
      }
    }
    score = Math.min(100, score)
    const category = score < 40 ? 'weak' : score < 70 ? 'medium' : 'strong'
    return { category, score }
  }

  /**
   * Validate password and return result.
   * @description Runs length and requirement checks.
   * @param password - Password string
   * @param options - Optional length and requirements
   * @returns PasswordResult with valid and errors
   */
  static validate(password: string, options: Types.PasswordOptions = {}): Types.PasswordResult {
    if (!Utils.isString(password)) {
      return Utils.notStringResult('Password')
    }
    const resolvedOptions = Password.resolveOptions(options)
    if (resolvedOptions === null) {
      return Utils.invalidOptionsResult('password')
    }
    const errors = Password.runChecks(password, resolvedOptions)
    return Utils.toValidationResult(errors)
  }

  /**
   * Ensure at least one char matching regex.
   * @description Inserts from charSet if none present.
   * @param result - Current password string
   * @param length - Length of result
   * @param regex - Pattern to require
   * @param charSet - Chars to pick from
   * @returns Modified result with one match
   */
  private static ensureOneChar(
    result: string,
    length: number,
    regex: RegExp,
    charSet: string
  ): string {
    if (regex.test(result)) {
      return result
    }
    const insertIndex = Utils.randomInRange(0, length - 1)
    const pickIndex = Utils.randomInRange(0, charSet.length - 1)
    const pick = charSet[pickIndex] ?? charSet[0]
    return `${result.slice(0, insertIndex)}${pick}${result.slice(insertIndex + 1)}`
  }

  /**
   * Resolve password options with defaults.
   * @description Validates range and requirement flags.
   * @param options - User password options
   * @returns Resolved options or null if invalid
   */
  private static resolveOptions(
    options: Types.PasswordOptions
  ): Types.ResolvedPasswordOptions | null {
    const range = Utils.resolveMinMax(options, Password.defaultLengths)
    if (range === null) {
      return null
    }
    const minLength = Math.max(1, range.minLength)
    if (minLength > range.maxLength) {
      return null
    }
    return {
      ...range,
      minLength,
      requireDigit: options.requireDigit === true,
      requireLowercase: options.requireLowercase === true,
      requireSpecial: options.requireSpecial === true,
      requireUppercase: options.requireUppercase === true
    }
  }

  /**
   * Run length and requirement checks.
   * @description Pushes length and char-rule errors.
   * @param password - Password string
   * @param resolvedOptions - Resolved options
   * @returns Array of error messages
   */
  private static runChecks(
    password: string,
    resolvedOptions: Types.ResolvedPasswordOptions
  ): string[] {
    const errors = Utils.lengthErrors(
      password,
      resolvedOptions.minLength,
      resolvedOptions.maxLength,
      'Password'
    )
    for (const { regex, key } of Password.charRules) {
      if (resolvedOptions[key] && !regex.test(password)) {
        errors.push(Password.requirementMessages[key])
      }
    }
    return errors
  }
}
