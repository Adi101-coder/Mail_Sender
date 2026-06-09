export type CampaignStatus = 'Draft' | 'Scheduled' | 'Sending' | 'Completed' | 'Failed'
export type RecipientStatus = 'Pending' | 'Sent' | 'Failed'

export interface User {
  id: string
  name: string | null
  email: string
  createdAt: string
}

export interface Campaign {
  id: string
  userId: string
  campaignName: string
  subject: string
  body: string
  status: CampaignStatus
  scheduledAt: string | null
  createdAt: string
  recipients?: Recipient[]
  _count?: { recipients: number }
}

export interface Recipient {
  id: string
  campaignId: string
  email: string
  metadata: Record<string, string>
  status: RecipientStatus
  sentAt: string | null
}

export interface PersonalizedPreview {
  recipient: Recipient
  template: { subject: string; body: string }
  personalized: { subject: string; body: string }
}

export interface DashboardStats {
  campaignCount: number
  sentCount: number
  user: User | null
}

export interface CampaignSendStatus {
  campaign: Campaign
  stats: {
    total: number
    pending: number
    sent: number
    failed: number
  }
}
