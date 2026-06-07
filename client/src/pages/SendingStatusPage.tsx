import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
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
import type { CampaignSendStatus, RecipientStatus } from '@/types'

const recipientVariant: Record<RecipientStatus, 'secondary' | 'success' | 'destructive'> = {
  Pending: 'secondary',
  Sent: 'success',
  Failed: 'destructive',
}

export function SendingStatusPage() {
  const { id } = useParams<{ id: string }>()
  const [status, setStatus] = useState<CampaignSendStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchStatus = () => {
      api
        .getCampaignStatus(id)
        .then(setStatus)
        .finally(() => setLoading(false))
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 2000)

    return () => clearInterval(interval)
  }, [id])

  if (loading && !status) {
    return <Skeleton className="h-96 w-full" />
  }

  if (!status) {
    return <p>Unable to load campaign status.</p>
  }

  const { campaign, stats } = status
  const progress = stats.total > 0 ? ((stats.sent + stats.failed) / stats.total) * 100 : 0
  const isComplete = campaign.status === 'Completed' || campaign.status === 'Failed'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sending Status</h1>
        <p className="text-muted-foreground">{campaign.campaignName}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Campaign Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                campaign.status === 'Completed'
                  ? 'success'
                  : campaign.status === 'Failed'
                    ? 'destructive'
                    : 'warning'
              }
            >
              {campaign.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-2xl font-bold">{stats.sent}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-2xl font-bold">{stats.failed}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            {!isComplete && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            <span className="text-2xl font-bold">{stats.pending}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
          <CardDescription>
            Sending in batches of 25 with a 2-second delay between batches.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground">
            {stats.sent + stats.failed} of {stats.total} processed ({Math.round(progress)}%)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recipient Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaign.recipients?.map((recipient) => (
                <TableRow key={recipient.id}>
                  <TableCell>{recipient.email}</TableCell>
                  <TableCell>
                    <Badge variant={recipientVariant[recipient.status]}>{recipient.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {recipient.sentAt ? new Date(recipient.sentAt).toLocaleString() : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isComplete && (
        <Button asChild>
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      )}
    </div>
  )
}
