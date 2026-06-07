import { CampaignStatus, Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'

export interface CreateCampaignInput {
  userId: string
  campaignName: string
  subject: string
  body: string
}

/** Create a new draft campaign for the authenticated user. */
export async function createCampaign(input: CreateCampaignInput) {
  return prisma.campaign.create({
    data: {
      userId: input.userId,
      campaignName: input.campaignName.trim(),
      subject: input.subject.trim(),
      body: input.body.trim(),
      status: CampaignStatus.Draft,
    },
  })
}

/** List all campaigns for a user with recipient counts. */
export async function listCampaigns(userId: string) {
  return prisma.campaign.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { recipients: true } },
    },
  })
}

/** Get a single campaign with recipients. */
export async function getCampaignById(userId: string, campaignId: string) {
  return prisma.campaign.findFirst({
    where: { id: campaignId, userId },
    include: {
      recipients: { orderBy: { email: 'asc' } },
      _count: { select: { recipients: true } },
    },
  })
}

/** Dashboard stats for the authenticated user. */
export async function getDashboardStats(userId: string) {
  const [campaignCount, sentCount, user] = await Promise.all([
    prisma.campaign.count({ where: { userId } }),
    prisma.recipient.count({ where: { campaign: { userId }, status: 'Sent' } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
  ])

  return { campaignCount, sentCount, user }
}

/** Update campaign status. */
export async function updateCampaignStatus(
  campaignId: string,
  status: CampaignStatus,
) {
  return prisma.campaign.update({
    where: { id: campaignId },
    data: { status },
  })
}

export type CampaignWithRecipients = Prisma.CampaignGetPayload<{
  include: { recipients: true }
}>
