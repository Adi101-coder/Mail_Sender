import { CampaignStatus, EmailLogStatus, RecipientStatus } from '@prisma/client'
import { BATCH_DELAY_MS, BATCH_SIZE } from '../../config/env.js'
import { prisma } from '../../lib/prisma.js'
import { sleep } from '../../utils/sleep.js'
import { sendGmailMessage } from '../gmail/gmail.service.js'
import { updateCampaignStatus } from '../campaign/campaign.service.js'

/** Send emails to all pending recipients in batches with rate limiting. */
export async function sendCampaignEmails(userId: string, campaignId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
    include: { recipients: true },
  })

  if (!campaign) {
    throw new Error('Campaign not found')
  }

  if (campaign.recipients.length === 0) {
    throw new Error('No recipients to send to')
  }

  await updateCampaignStatus(campaignId, CampaignStatus.Sending)

  const pendingRecipients = campaign.recipients.filter(
    (r) => r.status === RecipientStatus.Pending || r.status === RecipientStatus.Failed,
  )

  let hasFailures = false

  for (let i = 0; i < pendingRecipients.length; i += BATCH_SIZE) {
    const batch = pendingRecipients.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async (recipient) => {
        try {
          const gmailMessageId = await sendGmailMessage({
            userId,
            to: recipient.email,
            subject: campaign.subject,
            body: campaign.body,
          })

          await prisma.$transaction([
            prisma.recipient.update({
              where: { id: recipient.id },
              data: { status: RecipientStatus.Sent, sentAt: new Date() },
            }),
            prisma.emailLog.create({
              data: {
                recipientId: recipient.id,
                gmailMessageId,
                status: EmailLogStatus.Sent,
              },
            }),
          ])
        } catch (error) {
          hasFailures = true
          console.error(`Failed to send to ${recipient.email}:`, error)

          await prisma.$transaction([
            prisma.recipient.update({
              where: { id: recipient.id },
              data: { status: RecipientStatus.Failed },
            }),
            prisma.emailLog.create({
              data: {
                recipientId: recipient.id,
                gmailMessageId: null,
                status: EmailLogStatus.Failed,
              },
            }),
          ])
        }
      }),
    )

    if (i + BATCH_SIZE < pendingRecipients.length) {
      await sleep(BATCH_DELAY_MS)
    }
  }

  const finalStatus = hasFailures ? CampaignStatus.Failed : CampaignStatus.Completed
  await updateCampaignStatus(campaignId, finalStatus)

  return getCampaignSendStatus(userId, campaignId)
}

/** Get current send progress for a campaign. */
export async function getCampaignSendStatus(userId: string, campaignId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
    include: {
      recipients: { orderBy: { email: 'asc' } },
    },
  })

  if (!campaign) {
    throw new Error('Campaign not found')
  }

  const stats = {
    total: campaign.recipients.length,
    pending: campaign.recipients.filter((r) => r.status === RecipientStatus.Pending).length,
    sent: campaign.recipients.filter((r) => r.status === RecipientStatus.Sent).length,
    failed: campaign.recipients.filter((r) => r.status === RecipientStatus.Failed).length,
  }

  return { campaign, stats }
}
