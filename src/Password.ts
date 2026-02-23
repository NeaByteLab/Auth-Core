import type * as Types from '@app/Types.ts'
import * as Utils from '@app/Utils.ts'

/** Default min and max password length. */
const defaultLengths = { minLength: 8, maxLength: 128 } as const
/** Default resolved options when user options are invalid */
const defaultResolvedOptions: Types.ResolvedPasswordOptions = {
  maxLength: defaultLengths.maxLength,
  minLength: defaultLengths.minLength,
  requireDigit: false,
  requireLowercase: false,
  requireSpecial: false,
  requireUppercase: false
}
/** Lowercase letters for generation */
const lowercaseLetters = 'abcdefghijklmnopqrstuvwxyz'
/** Uppercase letters for generation */
const uppercaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
/** Digit characters for generation */
const digits = '0123456789'
/** Special characters for generation */
const specialChars = '!@#$%^&*()_+-=[]{};\':"|,.<>/?'
/** Regex matching one special character */
const specialRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/
/** Requirement key to user-facing error message. */
const requirementMessages: Record<
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
const charRules = [
  { regex: /\d/, charSet: digits, key: 'requireDigit' as const, strengthScore: 15 },
  {
    regex: /[a-z]/,
    charSet: lowercaseLetters,
    key: 'requireLowercase' as const,
    strengthScore: 15
  },
  { regex: specialRegex, charSet: specialChars, key: 'requireSpecial' as const, strengthScore: 20 },
  { regex: /[A-Z]/, charSet: uppercaseLetters, key: 'requireUppercase' as const, strengthScore: 15 }
] as const

/**
 * Ensures one char matches regex.
 * @description Inserts matching char if missing.
 * @param result - Current password string
 * @param length - Length of result
 * @param regex - Pattern to require
 * @param charSet - Chars to pick from
 * @returns String with one match
 */
function ensureOneChar(result: string, length: number, regex: RegExp, charSet: string): string {
  if (regex.test(result)) {
    return result
  }
  const randomForIndex = Utils.randomUint32()
  const randomForPick = Utils.randomUint32()
  const insertIndex = Math.min(length - 1, Math.floor((length * randomForIndex) / 2 ** 32))
  const pick = charSet[Math.floor((charSet.length * randomForPick) / 2 ** 32)] ?? charSet[0]
  return `${result.slice(0, insertIndex)}${pick}${result.slice(insertIndex + 1)}`
}

/**
 * Resolves password options.
 * @description Merges length and requirement flags.
 * @param options - User options
 * @returns Resolved options or null
 */
function resolveOptions(options: Types.PasswordOptions): Types.ResolvedPasswordOptions | null {
  const range = Utils.resolveMinMax(options, defaultLengths)
  if (range === null) {
    return null
  }
  return {
    ...range,
    requireDigit: options.requireDigit === true,
    requireLowercase: options.requireLowercase === true,
    requireSpecial: options.requireSpecial === true,
    requireUppercase: options.requireUppercase === true
  }
}

/**
 * Runs checks and returns errors.
 * @description Length and requirement error messages.
 * @param password - Password to check
 * @param resolvedOptions - Resolved options
 * @returns Error messages
 */
function runChecks(password: string, resolvedOptions: Types.ResolvedPasswordOptions): string[] {
  const errors = Utils.lengthErrors(
    password,
    resolvedOptions.minLength,
    resolvedOptions.maxLength,
    'Password'
  )
  for (const { regex, key } of charRules) {
    if (resolvedOptions[key] && !regex.test(password)) {
      errors.push(requirementMessages[key])
    }
  }
  return errors
}

/**
 * Password validation and generation.
 * @description Validates rules scores strength generates.
 */
export default class Password {
  /**
   * Generates random password.
   * @description Meets length and requirement options.
   * @param options - Length and require rules
   * @returns Generated password string
   */
  static generate(options: Types.PasswordOptions = {}): string {
    const resolvedOptions = resolveOptions(options) ?? defaultResolvedOptions
    const requiredCount = charRules.filter((rule) => resolvedOptions[rule.key]).length
    const minLength = Math.max(requiredCount, resolvedOptions.minLength)
    const maxLength = Math.min(1024, resolvedOptions.maxLength)
    const rand = Utils.randomUint32()
    const length = maxLength >= minLength
      ? minLength + Math.floor(((maxLength - minLength + 1) * rand) / 2 ** 32)
      : minLength
    let charset = ''
    for (const { charSet, key } of charRules) {
      if (resolvedOptions[key]) {
        charset += charSet
      }
    }
    if (charset.length === 0) {
      charset = `${lowercaseLetters}${uppercaseLetters}${digits}`
    }
    const randomBytes = new Uint8Array(length)
    crypto.getRandomValues(randomBytes)
    let result = ''
    for (let index = 0; index < length; index++) {
      result += charset[(randomBytes[index] ?? 0) % charset.length]
    }
    for (const { regex, charSet, key } of charRules) {
      if (resolvedOptions[key]) {
        result = ensureOneChar(result, length, regex, charSet)
      }
    }
    return result
  }

  /**
   * Checks password valid.
   * @description True when validate returns valid.
   * @param password - String to validate
   * @param options - Optional rules
   * @returns True if valid
   */
  static isValid(password: string, options: Types.PasswordOptions = {}): boolean {
    return Password.validate(password, options).valid
  }

  /**
   * Computes password strength score.
   * @description Category and numeric score.
   * @param password - String to score
   * @returns Category and score
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
    for (const { regex, strengthScore } of charRules) {
      if (regex.test(password)) {
        score += strengthScore
      }
    }
    score = Math.min(100, score)
    const category = score < 40 ? 'weak' : score < 70 ? 'medium' : 'strong'
    return { category, score }
  }

  /**
   * Validates password against rules.
   * @description Valid flag and errors array.
   * @param password - String to validate
   * @param options - Optional rules
   * @returns Valid flag and errors
   */
  static validate(password: string, options: Types.PasswordOptions = {}): Types.PasswordResult {
    if (!Utils.isString(password)) {
      return { valid: false, errors: ['Password must be a string'] }
    }
    const resolvedOptions = resolveOptions(options)
    if (resolvedOptions === null) {
      return { valid: false, errors: ['Invalid password length options'] }
    }
    const errors = runChecks(password, resolvedOptions)
    return Utils.toValidationResult(errors)
  }
}
