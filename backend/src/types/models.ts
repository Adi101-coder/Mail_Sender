export type CampaignStatus = 'Draft' | 'Sending' | 'Completed' | 'Failed'
export type RecipientStatus = 'Pending' | 'Sent' | 'Failed'
export type EmailLogStatus = 'Sent' | 'Failed'

export interface User {
  id: string
  name: string | null
  email: string
  googleId: string
  accessToken: string
  refreshToken: string
  createdAt: Date
}

export interface Campaign {
  id: string
  userId: string
  campaignName: string
  subject: string
  body: string
  status: CampaignStatus
  createdAt: Date
}

export interface Recipient {
  id: string
  campaignId: string
  email: string
  metadata: Record<string, string>
  status: RecipientStatus
  sentAt: Date | null
}

export interface EmailLog {
  id: string
  recipientId: string
  gmailMessageId: string | null
  status: EmailLogStatus
  createdAt: Date
}

export interface CampaignWithMeta extends Campaign {
  recipients?: Recipient[]
  _count?: { recipients: number }
}

export interface PublicUser {
  id: string
  name: string | null
  email: string
  createdAt: Date
}
