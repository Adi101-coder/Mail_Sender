import { MAX_RECIPIENTS_PER_CAMPAIGN } from '../../config/env.js'
import { store } from '../../lib/store.js'
import type { RecipientRow } from '../../utils/csvParsing.js'
import { parseAndValidateEmails } from '../../utils/emailValidation.js'

/** Add validated recipients to a campaign, replacing existing ones. */
export async function addRecipientsToCampaign(
  campaignId: string,
  rows: RecipientRow[],
) {
  const seen = new Set<string>()
  const valid: RecipientRow[] = []
  const invalid: string[] = []

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

    if (valid.length >= MAX_RECIPIENTS_PER_CAMPAIGN) break
  }

  if (valid.length === 0) {
    throw new Error('No valid email addresses provided')
  }

  await store.replaceRecipients(campaignId, valid)

  return { added: valid.length, invalid }
}
