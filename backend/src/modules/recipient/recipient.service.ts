import { MAX_RECIPIENTS_PER_CAMPAIGN } from '../../config/env.js'
import { store } from '../../lib/store.js'
import { parseAndValidateEmails } from '../../utils/emailValidation.js'

/** Add validated recipients to a campaign, replacing existing ones. */
export async function addRecipientsToCampaign(
  campaignId: string,
  rawEmails: string[],
) {
  const { valid, invalid } = parseAndValidateEmails(rawEmails)

  if (valid.length === 0) {
    throw new Error('No valid email addresses provided')
  }

  if (valid.length > MAX_RECIPIENTS_PER_CAMPAIGN) {
    throw new Error(`Maximum ${MAX_RECIPIENTS_PER_CAMPAIGN} recipients allowed per campaign`)
  }

  await store.replaceRecipients(campaignId, valid)

  return { added: valid.length, invalid }
}
