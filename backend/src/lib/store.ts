import type { Types } from 'mongoose'
import {
  CampaignModel,
  EmailLogModel,
  RecipientModel,
  UserModel,
} from '../models/index.js'
import type {
  Campaign,
  CampaignStatus,
  CampaignWithMeta,
  EmailLog,
  EmailLogStatus,
  PublicUser,
  Recipient,
  RecipientStatus,
  User,
} from '../types/models.js'

function toUser(doc: {
  _id: Types.ObjectId
  name?: string | null
  email: string
  googleId: string
  accessToken: string
  refreshToken: string
  createdAt: Date
}): User {
  return {
    id: doc._id.toString(),
    name: doc.name ?? null,
    email: doc.email,
    googleId: doc.googleId,
    accessToken: doc.accessToken,
    refreshToken: doc.refreshToken,
    createdAt: doc.createdAt,
  }
}

function toCampaign(doc: {
  _id: Types.ObjectId
  userId: Types.ObjectId
  campaignName: string
  subject: string
  body: string
  status: CampaignStatus
  scheduledAt?: Date | null
  createdAt: Date
}): Campaign {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    campaignName: doc.campaignName,
    subject: doc.subject,
    body: doc.body,
    status: doc.status,
    scheduledAt: doc.scheduledAt ?? null,
    createdAt: doc.createdAt,
  }
}

function toMetadataRecord(
  metadata?: Map<string, string> | Record<string, string> | null,
): Record<string, string> {
  if (!metadata) return {}

  if (metadata instanceof Map) {
    return Object.fromEntries(metadata.entries())
  }

  return { ...metadata }
}

function toRecipient(doc: {
  _id: Types.ObjectId
  campaignId: Types.ObjectId
  email: string
  metadata?: Map<string, string> | Record<string, string> | null
  status: RecipientStatus
  sentAt?: Date | null
}): Recipient {
  return {
    id: doc._id.toString(),
    campaignId: doc.campaignId.toString(),
    email: doc.email,
    metadata: toMetadataRecord(doc.metadata),
    status: doc.status,
    sentAt: doc.sentAt ?? null,
  }
}

function toEmailLog(doc: {
  _id: Types.ObjectId
  recipientId: Types.ObjectId
  gmailMessageId?: string | null
  status: EmailLogStatus
  createdAt: Date
}): EmailLog {
  return {
    id: doc._id.toString(),
    recipientId: doc.recipientId.toString(),
    gmailMessageId: doc.gmailMessageId ?? null,
    status: doc.status,
    createdAt: doc.createdAt,
  }
}

async function attachCampaignMeta(
  campaign: ReturnType<typeof toCampaign>,
): Promise<CampaignWithMeta> {
  const recipients = await RecipientModel.find({
    campaignId: campaign.id,
  }).sort({ email: 1 })

  const mapped = recipients.map((doc) => toRecipient(doc))

  return {
    ...campaign,
    recipients: mapped,
    _count: { recipients: mapped.length },
  }
}

async function deleteCampaignData(campaignId: string): Promise<void> {
  const recipients = await RecipientModel.find({ campaignId }).select('_id')
  const recipientIds = recipients.map((r) => r._id)

  if (recipientIds.length > 0) {
    await EmailLogModel.deleteMany({ recipientId: { $in: recipientIds } })
    await RecipientModel.deleteMany({ _id: { $in: recipientIds } })
  }

  await CampaignModel.findByIdAndDelete(campaignId)
}

export const store = {
  async upsertUser(
    data: Omit<User, 'id' | 'createdAt'> & { id?: string },
  ): Promise<User> {
    const existing = await UserModel.findOne({ googleId: data.googleId })

    if (existing) {
      existing.name = data.name
      existing.email = data.email
      existing.accessToken = data.accessToken
      existing.refreshToken = data.refreshToken
      await existing.save()
      return toUser(existing)
    }

    const user = await UserModel.create({
      name: data.name,
      email: data.email,
      googleId: data.googleId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    })

    return toUser(user)
  },

  async findUserById(id: string): Promise<User | null> {
    const user = await UserModel.findById(id)
    return user ? toUser(user) : null
  },

  async updateUserTokens(
    id: string,
    tokens: { accessToken?: string; refreshToken?: string },
  ): Promise<User | null> {
    const user = await UserModel.findById(id)
    if (!user) return null

    if (tokens.accessToken) user.accessToken = tokens.accessToken
    if (tokens.refreshToken) user.refreshToken = tokens.refreshToken
    await user.save()

    return toUser(user)
  },

  async deleteUser(id: string): Promise<void> {
    const campaigns = await CampaignModel.find({ userId: id }).select('_id')
    for (const campaign of campaigns) {
      await deleteCampaignData(campaign._id.toString())
    }
    await UserModel.findByIdAndDelete(id)
  },

  toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    }
  },

  async createCampaign(data: {
    userId: string
    campaignName: string
    subject: string
    body: string
  }): Promise<Campaign> {
    const campaign = await CampaignModel.create({
      userId: data.userId,
      campaignName: data.campaignName,
      subject: data.subject,
      body: data.body,
      status: 'Draft',
    })

    return toCampaign(campaign)
  },

  async listCampaigns(userId: string): Promise<CampaignWithMeta[]> {
    const campaigns = await CampaignModel.find({ userId })
      .sort({ createdAt: -1 })

    return Promise.all(campaigns.map((doc) => attachCampaignMeta(toCampaign(doc))))
  },

  async getCampaign(campaignId: string, userId?: string): Promise<CampaignWithMeta | null> {
    const campaign = await CampaignModel.findById(campaignId)
    if (!campaign) return null
    if (userId && campaign.userId.toString() !== userId) return null
    return attachCampaignMeta(toCampaign(campaign))
  },

  async updateCampaignStatus(
    campaignId: string,
    status: CampaignStatus,
  ): Promise<Campaign | null> {
    const campaign = await CampaignModel.findByIdAndUpdate(
      campaignId,
      { status },
      { new: true },
    )
    return campaign ? toCampaign(campaign) : null
  },

  async scheduleCampaign(campaignId: string, scheduledAt: Date): Promise<Campaign | null> {
    const campaign = await CampaignModel.findByIdAndUpdate(
      campaignId,
      { status: 'Scheduled', scheduledAt },
      { new: true },
    )
    return campaign ? toCampaign(campaign) : null
  },

  async clearCampaignSchedule(campaignId: string): Promise<Campaign | null> {
    const campaign = await CampaignModel.findByIdAndUpdate(
      campaignId,
      { status: 'Draft', scheduledAt: null },
      { new: true },
    )
    return campaign ? toCampaign(campaign) : null
  },

  async findDueScheduledCampaigns(): Promise<Array<{ id: string; userId: string }>> {
    const now = new Date()
    const dueCampaigns = await CampaignModel.find({
      status: 'Scheduled',
      scheduledAt: { $lte: now },
    }).select('_id userId')

    return dueCampaigns.map((campaign) => ({
      id: campaign._id.toString(),
      userId: campaign.userId.toString(),
    }))
  },

  /** Recover campaigns stuck in Sending with pending recipients (e.g. after a crash). */
  async findStuckSendingCampaigns(): Promise<Array<{ id: string; userId: string }>> {
    const sendingCampaigns = await CampaignModel.find({ status: 'Sending' }).select('_id userId')
    const stuck: Array<{ id: string; userId: string }> = []

    for (const campaign of sendingCampaigns) {
      const pendingCount = await RecipientModel.countDocuments({
        campaignId: campaign._id,
        status: { $in: ['Pending', 'Failed'] },
      })

      if (pendingCount > 0) {
        stuck.push({
          id: campaign._id.toString(),
          userId: campaign.userId.toString(),
        })
      }
    }

    return stuck
  },

  async countCampaigns(userId: string): Promise<number> {
    return CampaignModel.countDocuments({ userId })
  },

  async countSentRecipients(userId: string): Promise<number> {
    const campaigns = await CampaignModel.find({ userId }).select('_id')
    const campaignIds = campaigns.map((c) => c._id)

    if (campaignIds.length === 0) return 0

    return RecipientModel.countDocuments({
      campaignId: { $in: campaignIds },
      status: 'Sent',
    })
  },

  async replaceRecipients(
    campaignId: string,
    recipients: Array<{ email: string; metadata?: Record<string, string> }>,
  ): Promise<void> {
    const existingRecipients = await RecipientModel.find({ campaignId }).select('_id')
    const recipientIds = existingRecipients.map((r) => r._id)

    if (recipientIds.length > 0) {
      await EmailLogModel.deleteMany({ recipientId: { $in: recipientIds } })
      await RecipientModel.deleteMany({ _id: { $in: recipientIds } })
    }

    if (recipients.length > 0) {
      await RecipientModel.insertMany(
        recipients.map((recipient) => ({
          campaignId,
          email: recipient.email,
          metadata: recipient.metadata ?? {},
          status: 'Pending',
          sentAt: null,
        })),
      )
    }
  },

  async updateRecipient(
    recipientId: string,
    data: { status: RecipientStatus; sentAt?: Date | null },
  ): Promise<Recipient | null> {
    const recipient = await RecipientModel.findByIdAndUpdate(
      recipientId,
      {
        status: data.status,
        ...(data.sentAt !== undefined ? { sentAt: data.sentAt } : {}),
      },
      { new: true },
    )

    return recipient ? toRecipient(recipient) : null
  },

  async createEmailLog(data: {
    recipientId: string
    gmailMessageId: string | null
    status: EmailLogStatus
  }): Promise<EmailLog> {
    const log = await EmailLogModel.create({
      recipientId: data.recipientId,
      gmailMessageId: data.gmailMessageId,
      status: data.status,
    })

    return toEmailLog(log)
  },
}
