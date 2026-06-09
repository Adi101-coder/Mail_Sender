import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarClock, Send, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import type { Campaign, PersonalizedPreview, Recipient, RecipientStatus } from '@/types'

const recipientVariant: Record<RecipientStatus, 'secondary' | 'success' | 'destructive'> = {
  Pending: 'secondary',
  Sent: 'success',
  Failed: 'destructive',
}

function formatMetadataSummary(metadata: Record<string, string>): string {
  const entries = Object.entries(metadata)
  if (entries.length === 0) return '—'

  return entries
    .slice(0, 2)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' · ')
}

function toDatetimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function defaultScheduleValue(): string {
  const nextHour = new Date(Date.now() + 60 * 60 * 1000)
  nextHour.setSeconds(0, 0)
  return toDatetimeLocalValue(nextHour)
}

export function PreviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [scheduledAt, setScheduledAt] = useState(defaultScheduleValue)
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null)
  const [preview, setPreview] = useState<PersonalizedPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    api
      .getCampaign(id)
      .then((loadedCampaign) => {
        setCampaign(loadedCampaign)
        if (loadedCampaign.scheduledAt) {
          setScheduledAt(toDatetimeLocalValue(new Date(loadedCampaign.scheduledAt)))
        }
        const firstRecipient = loadedCampaign.recipients?.[0]
        if (firstRecipient) {
          setSelectedRecipientId(firstRecipient.id)
        }
      })
      .catch(() => toast.error('Failed to load campaign'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id || !selectedRecipientId) return

    setPreviewLoading(true)
    api
      .getPersonalizedPreview(id, selectedRecipientId)
      .then(setPreview)
      .catch((error) => {
        setPreview(null)
        toast.error(error instanceof Error ? error.message : 'Failed to generate preview')
      })
      .finally(() => setPreviewLoading(false))
  }, [id, selectedRecipientId])

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

  const handleSchedule = async () => {
    if (!id || !campaign?.recipients?.length) {
      toast.error('Add recipients before scheduling')
      return
    }

    const scheduledDate = new Date(scheduledAt)
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
      toast.error('Choose a future date and time')
      return
    }

    setScheduling(true)
    try {
      await api.scheduleCampaign(id, scheduledDate.toISOString())
      toast.success(`Campaign scheduled for ${scheduledDate.toLocaleString()}`)
      navigate(`/campaigns/${id}/sending`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to schedule campaign')
    } finally {
      setScheduling(false)
    }
  }

  const handleCancelSchedule = async () => {
    if (!id) return
    setScheduling(true)
    try {
      const status = await api.cancelSchedule(id)
      setCampaign(status.campaign)
      toast.success('Schedule cancelled')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel schedule')
    } finally {
      setScheduling(false)
    }
  }

  const handleRecipientSelect = (recipient: Recipient) => {
    setSelectedRecipientId(recipient.id)
  }

  if (loading) {
    return <Skeleton className="h-96 w-full" />
  }

  if (!campaign) {
    return <p>Campaign not found.</p>
  }

  const recipients = campaign.recipients ?? []
  const hasMetadata = recipients.some((recipient) => Object.keys(recipient.metadata ?? {}).length > 0)
  const isScheduled = campaign.status === 'Scheduled'
  const canSendOrSchedule = recipients.length > 0 && campaign.status !== 'Sending' && campaign.status !== 'Completed'

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
          <Button onClick={handleSend} disabled={sending || !canSendOrSchedule}>
            <Send className="mr-2 h-4 w-4" />
            {sending ? 'Starting...' : 'Send Now'}
          </Button>
        </div>
      </div>

      {isScheduled && campaign.scheduledAt && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm">
              <CalendarClock className="h-4 w-4 text-amber-700" />
              <span>
                Scheduled to send on{' '}
                <strong>{new Date(campaign.scheduledAt).toLocaleString()}</strong>
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleCancelSchedule} disabled={scheduling}>
              Cancel schedule
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Schedule Send
          </CardTitle>
          <CardDescription>
            Pick a date and time to automatically send personalized emails to all recipients.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="scheduledAt">Send at</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              min={toDatetimeLocalValue(new Date())}
              onChange={(e) => setScheduledAt(e.target.value)}
              disabled={!canSendOrSchedule}
            />
          </div>
          <Button
            onClick={handleSchedule}
            disabled={scheduling || !canSendOrSchedule}
            className="sm:mb-0.5"
          >
            {scheduling ? 'Scheduling...' : isScheduled ? 'Reschedule' : 'Schedule Send'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Base Template
          </CardTitle>
          <CardDescription>
            {hasMetadata
              ? 'The AI agent uses this as a starting point and customizes each email using CSV business data.'
              : 'All recipients will receive this same email. Upload a CSV with extra columns to enable AI personalization.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-sm font-medium">Subject: {campaign.subject}</p>
          <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">{campaign.body}</pre>
        </CardContent>
      </Card>

      {selectedRecipientId && (
        <Card>
          <CardHeader>
            <CardTitle>Personalized Preview</CardTitle>
            <CardDescription>
              Select a recipient below to see how the AI agent customizes the email for them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {previewLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : preview ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  For: <span className="font-medium text-foreground">{preview.recipient.email}</span>
                </p>
                <p className="text-sm font-medium">Subject: {preview.personalized.subject}</p>
                <pre className="whitespace-pre-wrap rounded-md border bg-background p-4 text-sm">
                  {preview.personalized.body}
                </pre>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Preview unavailable.</p>
            )}
          </CardContent>
        </Card>
      )}

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
                  <TableHead>Business Details</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.map((recipient) => (
                  <TableRow
                    key={recipient.id}
                    className={selectedRecipientId === recipient.id ? 'bg-muted/50' : 'cursor-pointer'}
                    onClick={() => handleRecipientSelect(recipient)}
                  >
                    <TableCell>{recipient.email}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {formatMetadataSummary(recipient.metadata ?? {})}
                    </TableCell>
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
