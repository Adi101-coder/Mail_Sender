import { RecipientStatus } from '@prisma/client'
import { MAX_RECIPIENTS_PER_CAMPAIGN } from '../../config/env.js'
import { prisma } from '../../lib/prisma.js'
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

  await prisma.$transaction(async (tx) => {
    await tx.recipient.deleteMany({ where: { campaignId } })
    await tx.recipient.createMany({
      data: valid.map((email) => ({
        campaignId,
        email,
        status: RecipientStatus.Pending,
      })),
    })
  })

  return { added: valid.length, invalid }
}
