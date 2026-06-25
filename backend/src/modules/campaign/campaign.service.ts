import { store } from '../../lib/store.js'
import type { CampaignStatus, CampaignWithMeta } from '../../types/models.js'

export interface CreateCampaignInput {
  userId: string
  campaignName: string
  subject: string
  body: string
}

/** Create a new draft campaign for the authenticated user. */
export async function createCampaign(input: CreateCampaignInput) {
  return store.createCampaign({
    userId: input.userId,
    campaignName: input.campaignName.trim(),
    subject: input.subject.trim(),
    body: input.body.trim(),
  })
}

/** List all campaigns for a user with recipient counts. */
export async function listCampaigns(userId: string) {
  return store.listCampaigns(userId)
}

/** Get a single campaign with recipients. */
export async function getCampaignById(userId: string, campaignId: string) {
  return store.getCampaign(campaignId, userId)
}

/** Dashboard stats for the authenticated user. */
export async function getDashboardStats(userId: string) {
  console.log('[Auth] getDashboardStats — start', userId)
  const t0 = Date.now()

  const user = await store.findUserById(userId)
  console.log('[Auth] getDashboardStats — findUserById', Date.now() - t0, 'ms')

  const t1 = Date.now()
  const [campaignCount, sentCount] = await Promise.all([
    store.countCampaigns(userId),
    store.countSentRecipients(userId),
  ])
  console.log('[Auth] getDashboardStats — counts', Date.now() - t1, 'ms', { campaignCount, sentCount })

  return {
    campaignCount,
    sentCount,
    user: user ? store.toPublicUser(user) : null,
  }
}

/** Update campaign status. */
export async function updateCampaignStatus(campaignId: string, status: CampaignStatus) {
  const updated = await store.updateCampaignStatus(campaignId, status)
  if (!updated) throw new Error('Campaign not found')
  return updated
}

export type CampaignWithRecipients = CampaignWithMeta
