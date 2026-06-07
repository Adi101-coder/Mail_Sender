import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api } from '@/lib/api'
import type { Campaign, RecipientStatus } from '@/types'

const recipientVariant: Record<RecipientStatus, 'secondary' | 'success' | 'destructive'> = {
  Pending: 'secondary',
  Sent: 'success',
  Failed: 'destructive',
}

export function PreviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!id) return
    api
      .getCampaign(id)
      .then(setCampaign)
      .catch(() => toast.error('Failed to load campaign'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSend = async () => {
    if (!id || !campaign?.recipients?.length) {
      toast.error('Add recipients before sending')
      return
    }
    setSending(true)
    try {
      await api.sendCampaign(id)
      toast.success('Campaign sending started')
      navigate(`/campaigns/${id}/sending`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start sending')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <Skeleton className="h-96 w-full" />
  }

  if (!campaign) {
    return <p>Campaign not found.</p>
  }

  const recipients = campaign.recipients ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Preview Campaign</h1>
          <p className="text-muted-foreground">{campaign.campaignName}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(`/campaigns/${id}/recipients`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleSend} disabled={sending || recipients.length === 0}>
            <Send className="mr-2 h-4 w-4" />
            {sending ? 'Starting...' : 'Send Campaign'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Preview</CardTitle>
          <CardDescription>Subject: {campaign.subject}</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">{campaign.body}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recipients ({recipients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {recipients.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No recipients yet.{' '}
              <button
                className="text-primary underline"
                onClick={() => navigate(`/campaigns/${id}/recipients`)}
              >
                Upload recipients
              </button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient Email</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.map((recipient) => (
                  <TableRow key={recipient.id}>
                    <TableCell>{recipient.email}</TableCell>
                    <TableCell>{campaign.subject}</TableCell>
                    <TableCell>
                      <Badge variant={recipientVariant[recipient.status]}>
                        {recipient.status === 'Pending' ? 'Ready' : recipient.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
