import { Link } from 'react-router-dom'
import { Calendar, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Campaign, CampaignStatus } from '@/types'

const statusVariant: Record<CampaignStatus, 'secondary' | 'warning' | 'success' | 'destructive'> = {
  Draft: 'secondary',
  Scheduled: 'warning',
  Sending: 'warning',
  Completed: 'success',
  Failed: 'destructive',
}

interface CampaignCardProps {
  campaign: Campaign
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const recipientCount = campaign._count?.recipients ?? campaign.recipients?.length ?? 0

  return (
    <Link to={`/campaigns/${campaign.id}/preview`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg">{campaign.campaignName}</CardTitle>
            <Badge variant={statusVariant[campaign.status]}>{campaign.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p className="truncate font-medium text-foreground">{campaign.subject}</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {recipientCount} recipients
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {campaign.status === 'Scheduled' && campaign.scheduledAt
                ? `Sends ${new Date(campaign.scheduledAt).toLocaleString()}`
                : new Date(campaign.createdAt).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
