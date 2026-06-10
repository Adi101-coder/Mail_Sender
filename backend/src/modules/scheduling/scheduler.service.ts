import { SCHEDULER_POLL_INTERVAL_MS } from '../../config/env.js'
import { store } from '../../lib/store.js'
import { sendCampaignEmails } from '../email-sending/email-sending.service.js'

let schedulerTimer: ReturnType<typeof setInterval> | null = null
const processingCampaigns = new Set<string>()

function triggerCampaignSend(campaign: { id: string; userId: string }, reason: string) {
  if (processingCampaigns.has(campaign.id)) return

  processingCampaigns.add(campaign.id)
  console.log(`[Scheduler] ${reason}: campaign ${campaign.id}`)

  sendCampaignEmails(campaign.userId, campaign.id)
    .catch((error) => {
      console.error(`[Scheduler] Send failed for campaign ${campaign.id}:`, error)
    })
    .finally(() => {
      processingCampaigns.delete(campaign.id)
    })
}

async function processDueCampaigns() {
  const [dueCampaigns, stuckCampaigns] = await Promise.all([
    store.findDueScheduledCampaigns(),
    store.findStuckSendingCampaigns(),
  ])

  for (const campaign of dueCampaigns) {
    triggerCampaignSend(campaign, 'Scheduled time reached')
  }

  for (const campaign of stuckCampaigns) {
    triggerCampaignSend(campaign, 'Resuming stuck send')
  }
}

/** Start polling for campaigns that are due to send. */
export function startCampaignScheduler() {
  if (schedulerTimer) return

  processDueCampaigns().catch((error) => {
    console.error('[Scheduler] Initial check failed:', error)
  })

  schedulerTimer = setInterval(() => {
    processDueCampaigns().catch((error) => {
      console.error('[Scheduler] Poll failed:', error)
    })
  }, SCHEDULER_POLL_INTERVAL_MS)

  console.log(`Campaign scheduler started (every ${SCHEDULER_POLL_INTERVAL_MS / 1000}s)`)
}
