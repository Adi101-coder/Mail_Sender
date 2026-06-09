import { BATCH_DELAY_MS, BATCH_SIZE } from '../../config/env.js'
import { store } from '../../lib/store.js'
import type { CampaignStatus } from '../../types/models.js'
import { sleep } from '../../utils/sleep.js'
import { updateCampaignStatus } from '../campaign/campaign.service.js'
import { sendGmailMessage } from '../gmail/gmail.service.js'
import { personalizeEmailForRecipient } from '../personalization/personalization.service.js'

const BLOCKED_SEND_STATUSES: CampaignStatus[] = ['Sending', 'Completed']

/** Send emails to all pending recipients in batches with rate limiting. */
export async function sendCampaignEmails(userId: string, campaignId: string) {
  const campaign = await store.getCampaign(campaignId, userId)

  if (!campaign) {
    throw new Error('Campaign not found')
  }

  if (BLOCKED_SEND_STATUSES.includes(campaign.status)) {
    return getCampaignSendStatus(userId, campaignId)
  }

  const campaignRecipients = campaign.recipients ?? []

  if (campaignRecipients.length === 0) {
    throw new Error('No recipients to send to')
  }

  if (campaign.status !== 'Sending') {
    await updateCampaignStatus(campaignId, 'Sending')
  }

  const pendingRecipients = campaignRecipients.filter(
    (r) => r.status === 'Pending' || r.status === 'Failed',
  )

  let hasFailures = false

  for (let i = 0; i < pendingRecipients.length; i += BATCH_SIZE) {
    const batch = pendingRecipients.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async (recipient) => {
        try {
          const personalized = await personalizeEmailForRecipient(
            campaign.subject,
            campaign.body,
            recipient,
          )

          const gmailMessageId = await sendGmailMessage({
            userId,
            to: recipient.email,
            subject: personalized.subject,
            body: personalized.body,
          })

          await store.updateRecipient(recipient.id, { status: 'Sent', sentAt: new Date() })
          await store.createEmailLog({
            recipientId: recipient.id,
            gmailMessageId,
            status: 'Sent',
          })
        } catch (error) {
          hasFailures = true
          console.error(`Failed to send to ${recipient.email}:`, error)

          await store.updateRecipient(recipient.id, { status: 'Failed' })
          await store.createEmailLog({
            recipientId: recipient.id,
            gmailMessageId: null,
            status: 'Failed',
          })
        }
      }),
    )

    if (i + BATCH_SIZE < pendingRecipients.length) {
      await sleep(BATCH_DELAY_MS)
    }
  }

  const finalStatus: CampaignStatus = hasFailures ? 'Failed' : 'Completed'
  await updateCampaignStatus(campaignId, finalStatus)

  return getCampaignSendStatus(userId, campaignId)
}

/** Get current send progress for a campaign. */
export async function getCampaignSendStatus(userId: string, campaignId: string) {
  const campaign = await store.getCampaign(campaignId, userId)

  if (!campaign) {
    throw new Error('Campaign not found')
  }

  const campaignRecipients = campaign.recipients ?? []

  const stats = {
    total: campaignRecipients.length,
    pending: campaignRecipients.filter((r) => r.status === 'Pending').length,
    sent: campaignRecipients.filter((r) => r.status === 'Sent').length,
    failed: campaignRecipients.filter((r) => r.status === 'Failed').length,
  }

  return { campaign, stats }
}

/** Generate a personalized email preview for one recipient. */
export async function getPersonalizedPreview(
  userId: string,
  campaignId: string,
  recipientId: string,
) {
  const campaign = await store.getCampaign(campaignId, userId)

  if (!campaign) {
    throw new Error('Campaign not found')
  }

  const recipient = campaign.recipients?.find((r) => r.id === recipientId)

  if (!recipient) {
    throw new Error('Recipient not found')
  }

  const personalized = await personalizeEmailForRecipient(
    campaign.subject,
    campaign.body,
    recipient,
  )

  return {
    recipient,
    template: { subject: campaign.subject, body: campaign.body },
    personalized,
  }
}

/** Schedule a campaign to send at a specific future time. */
export async function scheduleCampaignSend(
  userId: string,
  campaignId: string,
  scheduledAt: Date,
) {
  const campaign = await store.getCampaign(campaignId, userId)

  if (!campaign) {
    throw new Error('Campaign not found')
  }

  if (!campaign.recipients?.length) {
    throw new Error('No recipients to send to')
  }

  if (campaign.status === 'Sending' || campaign.status === 'Completed') {
    throw new Error('Campaign cannot be scheduled in its current state')
  }

  if (scheduledAt.getTime() <= Date.now()) {
    throw new Error('Scheduled time must be in the future')
  }

  const updated = await store.scheduleCampaign(campaignId, scheduledAt)
  if (!updated) throw new Error('Campaign not found')

  return getCampaignSendStatus(userId, campaignId)
}

/** Cancel a scheduled send and return the campaign to draft. */
export async function cancelScheduledSend(userId: string, campaignId: string) {
  const campaign = await store.getCampaign(campaignId, userId)

  if (!campaign) {
    throw new Error('Campaign not found')
  }

  if (campaign.status !== 'Scheduled') {
    throw new Error('Campaign is not scheduled')
  }

  const updated = await store.clearCampaignSchedule(campaignId)
  if (!updated) throw new Error('Campaign not found')

  return getCampaignSendStatus(userId, campaignId)
}
