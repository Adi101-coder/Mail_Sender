import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { DEFAULT_CAMPAIGN_BODY, DEFAULT_CAMPAIGN_SUBJECT } from '@/constants/emailTemplate'

export function CreateCampaignPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    campaignName: '',
    subject: '',
    body: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const campaign = await api.createCampaign(form)
      toast.success('Campaign saved')
      navigate(`/campaigns/${campaign.id}/recipients`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Campaign</h1>
        <p className="text-muted-foreground">
          Write a base email template. When you upload a CSV with business details, an AI agent will
          customize this for each recipient.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>
            Use the default outreach template or write your own — the AI adapts it per business using
            your CSV data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setForm({
                  campaignName: form.campaignName || 'Dealership Outreach',
                  subject: DEFAULT_CAMPAIGN_SUBJECT,
                  body: DEFAULT_CAMPAIGN_BODY,
                })
              }
            >
              Load default outreach template
            </Button>
            <div className="space-y-2">
              <Label htmlFor="campaignName">Campaign Name</Label>
              <Input
                id="campaignName"
                placeholder="Summer Outreach"
                value={form.campaignName}
                onChange={(e) => setForm({ ...form, campaignName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                placeholder={DEFAULT_CAMPAIGN_SUBJECT}
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Email Body</Label>
              <Textarea
                id="body"
                placeholder={DEFAULT_CAMPAIGN_BODY}
                rows={18}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Campaign'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
