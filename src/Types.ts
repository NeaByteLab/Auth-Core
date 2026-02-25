/** Email addr-spec local and domain. */
export type AddrSpecParts = {
  /** Domain part after @ */
  domain: string
  /** Local part before @ */
  localPart: string
}

/** Email validation options. */
export type EmailOptions = {
  /** Allow display name in angle brackets */
  allowDisplayName?: boolean
  /** Allow international local part */
  allowInternational?: boolean
  /** Max domain length */
  domainMaxLength?: number
  /** Max local part length */
  localPartMaxLength?: number
  /** Max full address length */
  maxLength?: number
}

/** Fullname validation options. */
export type FullnameOptions = MinMaxOptions & {
  /** Allow digits in name */
  allowDigits?: boolean
  /** Title-case each word when normalizing */
  titleCase?: boolean
}

/** Fullname validation result. */
export type FullnameResult = ValidationResult

/** Hostname (e.g. SNI) validation options. */
export type HostnameOptions = MinMaxOptions

/** Hostname validation result. */
export type HostnameResult = ValidationResult

/** Optional min max length user input. */
export type MinMaxOptions = {
  /** Maximum length allowed */
  maxLength?: number
  /** Minimum length required */
  minLength?: number
}

/** Email normalize options. */
export type NormalizeEmailOptions = {
  /** Lowercase local part when normalizing */
  lowercaseLocal?: boolean
}

/** Password validation options. */
export type PasswordOptions = MinMaxOptions & {
  /** Require at least one digit */
  requireDigit?: boolean
  /** Require at least one lowercase letter */
  requireLowercase?: boolean
  /** Require at least one special character */
  requireSpecial?: boolean
  /** Require at least one uppercase letter */
  requireUppercase?: boolean
}

/** Password validation result. */
export type PasswordResult = ValidationResult

/** Password strength category. */
export type PasswordStrengthCategory = 'weak' | 'medium' | 'strong'

/** Password strength score and category. */
export type PasswordStrengthResult = {
  /** Strength category label */
  category: PasswordStrengthCategory
  /** Numeric strength score */
  score: number
}

/** Resolved fullname options. */
export type ResolvedFullnameOptions = ResolvedMinMax & {
  /** Digits allowed */
  allowDigits: boolean
  /** Title-case when normalizing */
  titleCase: boolean
}

/** Resolved hostname options. */
export type ResolvedHostnameOptions = ResolvedMinMax

/** Resolved min max length range. */
export type ResolvedMinMax = {
  /** Maximum length */
  maxLength: number
  /** Minimum length */
  minLength: number
}

/** Resolved password options. */
export type ResolvedPasswordOptions = ResolvedMinMax & {
  /** Digit required */
  requireDigit: boolean
  /** Lowercase required */
  requireLowercase: boolean
  /** Special char required */
  requireSpecial: boolean
  /** Uppercase required */
  requireUppercase: boolean
}

/** Resolved username options. */
export type ResolvedUsernameOptions = ResolvedMinMax

/** Username validation options. */
export type UsernameOptions = MinMaxOptions

/** Username validation result. */
export type UsernameResult = ValidationResult

/** Validation result valid flag and errors. */
export type ValidationResult = {
  /** Error messages when invalid */
  errors: string[]
  /** True when no errors */
  valid: boolean
}
