const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Normalize and validate a list of email addresses. */
export function parseAndValidateEmails(rawEmails: string[]): {
  valid: string[]
  invalid: string[]
} {
  const valid: string[] = []
  const invalid: string[] = []
  const seen = new Set<string>()

  for (const raw of rawEmails) {
    const email = raw.trim().toLowerCase()

    if (!email) continue

    if (!EMAIL_REGEX.test(email)) {
      invalid.push(raw.trim())
      continue
    }

    if (seen.has(email)) continue

    seen.add(email)
    valid.push(email)
  }

  return { valid, invalid }
}

/** Extract emails from pasted text (comma, semicolon, or newline separated). */
export function parseEmailText(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((line) => line.trim())
    .filter(Boolean)
}
