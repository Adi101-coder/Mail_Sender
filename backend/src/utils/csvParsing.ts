import { parse } from 'csv-parse/sync'
import { parseAndValidateEmails } from './emailValidation.js'

const EMAIL_COLUMN_NAMES = ['email', 'e-mail', 'email_address', 'emailaddress', 'mail']

export interface RecipientRow {
  email: string
  metadata: Record<string, string>
}

/** Extract email address from a CSV row using common column names or the first column. */
function extractEmailFromRow(row: Record<string, string>): string {
  for (const [key, value] of Object.entries(row)) {
    if (EMAIL_COLUMN_NAMES.includes(key.trim().toLowerCase())) {
      return value.trim()
    }
  }

  return Object.values(row)[0]?.trim() ?? ''
}

/** Build metadata from all non-email columns in a CSV row. */
function extractMetadataFromRow(row: Record<string, string>): Record<string, string> {
  const metadata: Record<string, string> = {}

  for (const [key, value] of Object.entries(row)) {
    const trimmedKey = key.trim()
    const trimmedValue = value?.trim() ?? ''

    if (!trimmedKey || !trimmedValue) continue
    if (EMAIL_COLUMN_NAMES.includes(trimmedKey.toLowerCase())) continue

    metadata[trimmedKey] = trimmedValue
  }

  return metadata
}

/** Parse a CSV file into recipient rows with email + business metadata. */
export function parseRecipientCsv(csvContent: string): RecipientRow[] {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[]

  return records
    .map((row) => ({
      email: extractEmailFromRow(row),
      metadata: extractMetadataFromRow(row),
    }))
    .filter((row) => row.email)
}

/** Validate, dedupe, and cap recipient rows from CSV or other sources. */
export function parseAndValidateRecipientRows(
  rows: RecipientRow[],
  maxRecipients: number,
): {
  valid: RecipientRow[]
  invalid: string[]
} {
  const invalid: string[] = []
  const valid: RecipientRow[] = []
  const seen = new Set<string>()

  for (const row of rows) {
    const { valid: emails } = parseAndValidateEmails([row.email])

    if (emails.length === 0) {
      invalid.push(row.email)
      continue
    }

    const email = emails[0]

    if (seen.has(email)) continue

    seen.add(email)
    valid.push({ email, metadata: row.metadata })

    if (valid.length >= maxRecipients) break
  }

  return { valid, invalid }
}
