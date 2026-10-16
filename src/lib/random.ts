/** Random values from the browser's cryptographic generator (never Math.random for secrets). */

const LOWER = 'abcdefghjkmnpqrstuvwxyz'
const UPPER = 'ABCDEFGHJKMNPQRSTUVWXYZ'
const DIGITS = '23456789'
const SYMBOLS = '!@#$%^&*-_=+?'

function pick(chars: string, n: number) {
  const bytes = crypto.getRandomValues(new Uint32Array(n))
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

function shuffle(s: string) {
  const a = [...s]
  const r = crypto.getRandomValues(new Uint32Array(a.length))
  for (let i = a.length - 1; i > 0; i--) {
    const j = r[i] % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.join('')
}

export type PasswordStyle = 'simple' | 'random12' | 'secure16'

export const passwordStyles: { value: PasswordStyle; label: string }[] = [
  { value: 'simple', label: 'Abc12345' },
  { value: 'random12', label: 'Random 12' },
  { value: 'secure16', label: 'Secure 16' },
]

/**
 * simple    "Tsg78374": one capital, two lower case, five digits (meets Entra's 3-of-4 rule)
 * random12  12 letters and digits, at least one of each kind
 * secure16  16 with symbols
 */
export function generatePassword(style: PasswordStyle) {
  if (style === 'simple') return pick(UPPER, 1) + pick(LOWER, 2) + pick(DIGITS, 5)
  if (style === 'random12') return shuffle(pick(UPPER, 2) + pick(LOWER, 2) + pick(DIGITS, 2) + pick(UPPER + LOWER + DIGITS, 6))
  return shuffle(pick(UPPER, 2) + pick(LOWER, 2) + pick(DIGITS, 2) + pick(SYMBOLS, 2) + pick(UPPER + LOWER + DIGITS + SYMBOLS, 8))
}

/** Entra requires 8+ characters and 3 of: upper, lower, digit, symbol. */
export function passwordProblem(p: string) {
  if (p.length < 8) return 'At least 8 characters.'
  const kinds = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(p)).length
  return kinds < 3 ? 'Use 3 of: capital, lower case, number, symbol.' : null
}

/** A username like "u7k2m9qa": starts with a letter, lower case. */
export function generateUsername(length = 8) {
  return pick(LOWER, 1) + pick(LOWER + DIGITS, length - 1)
}
