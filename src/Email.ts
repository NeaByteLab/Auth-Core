import type * as Types from '@app/Types.ts'
import { Utils } from '@app/index.ts'

/**
 * Email validation and normalization.
 * @description Validates format, normalizes, extracts local and domain.
 */
export class Email {
  /** Private constructor to prevent instantiation */
  private constructor() {}
  /** Default email validation options */
  static readonly defaultOptions: Required<Types.EmailOptions> = {
    allowDisplayName: false,
    allowInternational: false,
    domainMaxLength: 253,
    localPartMaxLength: 64,
    maxLength: 254
  }

  /**
   * Get domain part of email.
   * @description Parses address and returns domain or null.
   * @param email - Email string possibly with display name
   * @returns Domain or null
   */
  static getDomain(email: string): string | null {
    return Email.getPart(email, 'domain')
  }

  /**
   * Get local part of email.
   * @description Parses address and returns local part or null.
   * @param email - Email string possibly with display name
   * @returns Local part or null
   */
  static getLocalPart(email: string): string | null {
    return Email.getPart(email, 'localPart')
  }

  /**
   * Check email valid per options.
   * @description Validates length and addr-spec format.
   * @param email - Email string
   * @param options - Optional max lengths and flags
   * @returns True if valid
   */
  static isValid(email: string, options: Types.EmailOptions = {}): boolean {
    if (!Utils.isString(email)) {
      return false
    }
    const mergedOptions = { ...Email.defaultOptions, ...options }
    if (
      !Utils.isNonNegativeFinite(mergedOptions.maxLength) ||
      !Utils.isNonNegativeFinite(mergedOptions.localPartMaxLength) ||
      !Utils.isNonNegativeFinite(mergedOptions.domainMaxLength)
    ) {
      return false
    }
    const addressSpec = Email.getAddrSpec(email, mergedOptions.allowDisplayName)
    if (addressSpec === null) {
      return false
    }
    return Email.isValidAddrSpec(addressSpec, mergedOptions)
  }

  /**
   * Normalize email to local@domain.
   * @description Lowercases domain; optional lowercase local.
   * @param email - Email string
   * @param options - Optional lowercaseLocal flag
   * @returns Normalized string or null
   */
  static normalize(email: string, options: Types.NormalizeEmailOptions = {}): string | null {
    if (!Utils.isString(email)) {
      return null
    }
    const parsed = Email.parseAddressSpec(email)
    if (parsed === null) {
      return null
    }
    const domain = parsed.domain.toLowerCase()
    const localPart = options.lowercaseLocal === true
      ? parsed.localPart.toLowerCase()
      : parsed.localPart
    return `${localPart}@${domain}`
  }

  /**
   * Extract addr-spec from input.
   * @description Handles angle-bracket and quoted display name.
   * @param input - Raw input string
   * @param allowDisplayName - Whether to strip display name
   * @returns Addr-spec or null
   */
  private static getAddrSpec(input: string, allowDisplayName: boolean): string | null {
    const trimmed = input.trim()
    if (allowDisplayName && trimmed.startsWith('"') && trimmed.includes('>')) {
      const match = trimmed.match(/<([^>]+)>/)
      const addressSpec = match?.[1]
      if (addressSpec !== undefined) {
        return addressSpec.trim()
      }
      return null
    }
    if (allowDisplayName && trimmed.includes('<') && trimmed.endsWith('>')) {
      const start = trimmed.indexOf('<')
      return trimmed.slice(start + 1, -1).trim()
    }
    return trimmed
  }

  /**
   * Get domain or local part.
   * @description Parses then returns requested part or null.
   * @param email - Email string
   * @param part - 'domain' or 'localPart'
   * @returns Part string or null
   */
  private static getPart(email: string, part: 'domain' | 'localPart'): string | null {
    if (!Utils.isString(email)) {
      return null
    }
    const parsed = Email.parseAddressSpec(email)
    if (parsed === null) {
      return null
    }
    return part === 'domain' ? parsed.domain.toLowerCase() : parsed.localPart
  }

  /**
   * Validate addr-spec format and lengths.
   * @description Checks local and domain regex and limits.
   * @param addressSpec - local@domain string
   * @param mergedOptions - Merged options with defaults
   * @returns True if valid
   */
  private static isValidAddrSpec(
    addressSpec: string,
    mergedOptions: Required<Types.EmailOptions>
  ): boolean {
    const parsed = Email.splitAddrSpec(addressSpec)
    if (parsed === null || addressSpec.length > mergedOptions.maxLength) {
      return false
    }
    if (
      parsed.localPart.length > mergedOptions.localPartMaxLength ||
      parsed.domain.length > mergedOptions.domainMaxLength
    ) {
      return false
    }
    const localPartRegex = mergedOptions.allowInternational
      ? /^[\x20-\x7E\u0080-\uFFFF]+$/
      : /^[a-zA-Z0-9._%+-]+$/
    if (!localPartRegex.test(parsed.localPart)) {
      return false
    }
    const domainRegex = new RegExp(
      '^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(' +
        '\\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\\.[a-zA-Z]{2,}$'
    )
    if (!domainRegex.test(parsed.domain)) {
      return false
    }
    return true
  }

  /**
   * Parse input into local and domain.
   * @description Extracts addr-spec then splits at @.
   * @param input - Raw email or display-name form
   * @returns AddrSpecParts or null
   */
  private static parseAddressSpec(input: string): Types.AddrSpecParts | null {
    const allowDisplayName = true
    const addressSpec = Email.getAddrSpec(input.trim(), allowDisplayName)
    if (addressSpec === null) {
      return null
    }
    return Email.splitAddrSpec(addressSpec)
  }

  /**
   * Split addr-spec at @ into parts.
   * @description Returns localPart and domain or null.
   * @param addressSpec - Single addr-spec string
   * @returns AddrSpecParts or null
   */
  private static splitAddrSpec(addressSpec: string): Types.AddrSpecParts | null {
    if (addressSpec.length === 0) {
      return null
    }
    const atSignIndex = addressSpec.indexOf('@')
    if (atSignIndex <= 0 || atSignIndex === addressSpec.length - 1) {
      return null
    }
    const localPart = addressSpec.slice(0, atSignIndex)
    const domain = addressSpec.slice(atSignIndex + 1)
    if (domain.length < 2 || !domain.includes('.')) {
      return null
    }
    return { localPart, domain }
  }
}
