import type * as Types from '@app/Types.ts'
import { Utils } from '@app/index.ts'

/**
 * Hostname validation and normalization for SNI and DNS.
 * @description RFC 1035, 1123, 6066; labels and IDNA via WHATWG URL.
 */
export class Hostname {
  /** Private constructor to prevent instantiation */
  private constructor() {}
  /** Default max hostname length per RFC 1035 */
  static readonly defaultMaxLength = 253
  /** Default min hostname length */
  static readonly defaultMinLength = 1
  /** Default resolved options for invalid input */
  static readonly defaultResolvedOptions: Types.ResolvedHostnameOptions = {
    minLength: 1,
    maxLength: 253
  }
  /** Max DNS label length per RFC 1035 */
  static readonly maxLabelLength = 63
  /** Single DNS label pattern per RFC 1123 */
  static readonly labelRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/

  /**
   * Check hostname valid per options.
   * @description Delegates to validate and returns valid flag.
   * @param hostname - Hostname string
   * @param options - Optional min/max length
   * @returns True if valid
   */
  static isValid(hostname: string, options: Types.HostnameOptions = {}): boolean {
    return Hostname.validate(hostname, options).valid
  }

  /**
   * Normalize hostname trim and lowercase.
   * @description Returns null if validation fails.
   * @param hostname - Hostname string
   * @param options - Optional min/max length
   * @returns Normalized string or null
   */
  static normalize(hostname: string, options: Types.HostnameOptions = {}): string | null {
    if (!Utils.isString(hostname)) {
      return null
    }
    const trimmed = hostname.trim().toLowerCase()
    const resolvedOptions = Hostname.resolveOptions(options) ?? Hostname.defaultResolvedOptions
    const errors = Hostname.runChecks(trimmed, resolvedOptions)
    if (errors.length > 0) {
      return null
    }
    return trimmed
  }

  /**
   * Validate hostname and return result.
   * @description Runs length and label checks; IDNA if xn--.
   * @param hostname - Hostname string
   * @param options - Optional min/max length
   * @returns HostnameResult with valid and errors
   */
  static validate(hostname: string, options: Types.HostnameOptions = {}): Types.HostnameResult {
    if (!Utils.isString(hostname)) {
      return Utils.notStringResult('Hostname')
    }
    const trimmed = hostname.trim()
    const resolvedOptions = Hostname.resolveOptions(options)
    if (resolvedOptions === null) {
      return Utils.invalidOptionsResult('hostname')
    }
    const errors = Hostname.runChecks(trimmed, resolvedOptions)
    return Utils.toValidationResult(errors)
  }

  /**
   * Check single label valid per RFC 1123.
   * @description Length and regex for one label.
   * @param label - Single DNS label
   * @returns True if valid
   */
  private static isValidLabel(label: string): boolean {
    if (label.length === 0 || label.length > Hostname.maxLabelLength) {
      return false
    }
    return Hostname.labelRegex.test(label)
  }

  /**
   * Resolve hostname options with defaults.
   * @description Validates min/max range.
   * @param options - User hostname options
   * @returns Resolved options or null if invalid
   */
  private static resolveOptions(
    options: Types.HostnameOptions
  ): Types.ResolvedHostnameOptions | null {
    const range = Utils.resolveMinMax(options, {
      minLength: Hostname.defaultMinLength,
      maxLength: Hostname.defaultMaxLength
    })
    if (range === null) {
      return null
    }
    return { ...range }
  }

  /**
   * Run length and label checks.
   * @description Pushes length, label, and IDNA errors.
   * @param hostname - Trimmed hostname string
   * @param resolvedOptions - Resolved min/max
   * @returns Array of error messages
   */
  private static runChecks(
    hostname: string,
    resolvedOptions: Types.ResolvedHostnameOptions
  ): string[] {
    const errors = Utils.lengthErrors(
      hostname,
      resolvedOptions.minLength,
      resolvedOptions.maxLength,
      'Hostname'
    )
    const labels = hostname.split('.')
    const hasEmptyLabel = labels.some((l) => l.length === 0)
    if (hasEmptyLabel) {
      errors.push('Hostname must not have leading or trailing dot (RFC 1035)')
    }
    for (const label of labels) {
      if (!Hostname.isValidLabel(label)) {
        if (!hasEmptyLabel) {
          errors.push(
            `Hostname label "${label}" is invalid (use letters, digits, hyphens; 1–${Hostname.maxLabelLength} chars per RFC 1123)`
          )
        }
        break
      }
    }
    if (errors.length === 0 && labels.some((l) => l.startsWith('xn--'))) {
      try {
        new URL(`http://${hostname}`)
      } catch {
        errors.push('Hostname contains invalid IDNA (punycode) label')
      }
    }
    return errors
  }
}
