import { SCHEDULER_POLL_INTERVAL_MS } from '../../config/env.js'
import { store } from '../../lib/store.js'
import { sendCampaignEmails } from '../email-sending/email-sending.service.js'

let schedulerTimer: ReturnType<typeof setInterval> | null = null

async function processDueCampaigns() {
  const dueCampaigns = await store.claimDueScheduledCampaigns()

  for (const campaign of dueCampaigns) {
    sendCampaignEmails(campaign.userId, campaign.id).catch((error) => {
      console.error(`Scheduled send failed for campaign ${campaign.id}:`, error)
    })
  }
}

/** Start polling for campaigns that are due to send. */
export function startCampaignScheduler() {
  if (schedulerTimer) return

  processDueCampaigns().catch((error) => {
    console.error('Initial scheduler check failed:', error)
  })

  schedulerTimer = setInterval(() => {
    processDueCampaigns().catch((error) => {
      console.error('Scheduler check failed:', error)
    })
  }, SCHEDULER_POLL_INTERVAL_MS)

  console.log(`Campaign scheduler started (every ${SCHEDULER_POLL_INTERVAL_MS / 1000}s)`)
}
