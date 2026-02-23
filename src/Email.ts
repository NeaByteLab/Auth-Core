import type * as Types from '@app/Types.ts'
import * as Utils from '@app/Utils.ts'

/** Default email validation options */
const defaultOptions: Required<Types.EmailOptions> = {
  allowDisplayName: false,
  allowInternational: false,
  domainMaxLength: 253,
  localPartMaxLength: 64,
  maxLength: 254
}

/**
 * Extracts addr-spec from input.
 * @description Angle-addr or raw string parsed.
 * @param input - Raw email or angle-addr string
 * @param allowDisplayName - Parse display name
 * @returns Addr-spec or null
 */
function getAddrSpec(input: string, allowDisplayName: boolean): string | null {
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
 * Returns domain or local part.
 * @description Part string or null if invalid.
 * @param email - Email string
 * @param part - 'domain' or 'localPart'
 * @returns Part string or null
 */
function getPart(email: string, part: 'domain' | 'localPart'): string | null {
  if (!Utils.isString(email)) {
    return null
  }
  const parsed = parseAddressSpec(email)
  if (parsed === null) {
    return null
  }
  return part === 'domain' ? parsed.domain.toLowerCase() : parsed.localPart
}

/**
 * Validates addr-spec length and chars.
 * @description Length and regex checks.
 * @param addressSpec - Parsed local@domain string
 * @param mergedOptions - Merged email options
 * @returns True if valid
 */
function isValidAddrSpec(
  addressSpec: string,
  mergedOptions: Required<Types.EmailOptions>
): boolean {
  const parsed = splitAddrSpec(addressSpec)
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
 * Parses email into component parts.
 * @description AddrSpec or null if invalid.
 * @param input - Email string
 * @returns AddrSpec parts or null
 */
function parseAddressSpec(input: string): Types.AddrSpecParts | null {
  const allowDisplayName = true
  const addressSpec = getAddrSpec(input.trim(), allowDisplayName)
  if (addressSpec === null) {
    return null
  }
  return splitAddrSpec(addressSpec)
}

/**
 * Splits addr-spec at @.
 * @description Local and domain or null.
 * @param addressSpec - Addr-spec string
 * @returns Local and domain or null
 */
function splitAddrSpec(addressSpec: string): Types.AddrSpecParts | null {
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

/**
 * Email validation and normalization.
 * @description Validates format normalizes extracts components.
 */
export default class Email {
  /**
   * Returns lowercased domain part.
   * @description Domain or null.
   * @param email - Email string
   * @returns Domain or null
   */
  static getDomain(email: string): string | null {
    return getPart(email, 'domain')
  }

  /**
   * Returns local part string.
   * @description Local part or null.
   * @param email - Email string
   * @returns Local part or null
   */
  static getLocalPart(email: string): string | null {
    return getPart(email, 'localPart')
  }

  /**
   * Checks email format valid.
   * @description True when format and options ok.
   * @param email - String to validate
   * @param options - Optional overrides
   * @returns True if valid
   */
  static isValid(email: string, options: Types.EmailOptions = {}): boolean {
    if (!Utils.isString(email)) {
      return false
    }
    const mergedOptions = { ...defaultOptions, ...options }
    if (
      !Utils.isNonNegativeFinite(mergedOptions.maxLength) ||
      !Utils.isNonNegativeFinite(mergedOptions.localPartMaxLength) ||
      !Utils.isNonNegativeFinite(mergedOptions.domainMaxLength)
    ) {
      return false
    }
    const addressSpec = getAddrSpec(email, mergedOptions.allowDisplayName)
    if (addressSpec === null) {
      return false
    }
    return isValidAddrSpec(addressSpec, mergedOptions)
  }

  /**
   * Normalizes email address string.
   * @description Lowercase options and canonical form.
   * @param email - Email string
   * @param options - Lowercase local part option
   * @returns Normalized email or null
   */
  static normalize(email: string, options: Types.NormalizeEmailOptions = {}): string | null {
    if (!Utils.isString(email)) {
      return null
    }
    const parsed = parseAddressSpec(email)
    if (parsed === null) {
      return null
    }
    const domain = parsed.domain.toLowerCase()
    const localPart = options.lowercaseLocal === true
      ? parsed.localPart.toLowerCase()
      : parsed.localPart
    return `${localPart}@${domain}`
  }
}
