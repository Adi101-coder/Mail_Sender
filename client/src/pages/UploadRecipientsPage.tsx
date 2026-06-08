import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FileUp, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'

export function UploadRecipientsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setLoading(true)
    try {
      const result = await api.addRecipientsText(id, text)
      toast.success(`Added ${result.added} recipients`)
      if (result.invalid.length > 0) {
        toast.warning(`${result.invalid.length} invalid emails skipped`)
      }
      navigate(`/campaigns/${id}/preview`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add recipients')
    } finally {
      setLoading(false)
    }
  }

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    setLoading(true)
    try {
      const result = await api.addRecipientsCsv(id, file)
      toast.success(`Added ${result.added} recipients from CSV`)
      if (result.invalid.length > 0) {
        toast.warning(`${result.invalid.length} invalid emails skipped`)
      }
      navigate(`/campaigns/${id}/preview`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload CSV')
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Recipients</h1>
        <p className="text-muted-foreground">
          Add up to 500 recipients via paste or CSV upload. Include business details in your CSV
          and the AI agent will personalize each email.
        </p>
      </div>

      <Alert>
        <AlertDescription>
          CSV format: include an <code className="rounded bg-muted px-1">email</code> column plus any
          business columns you want (e.g. business_name, address, city, industry). The AI agent reads
          every column and customizes each email accordingly. Duplicates and invalid emails are
          removed automatically.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Method 1: Paste Emails</CardTitle>
          <CardDescription>Separate emails by comma, semicolon, or new line.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasteSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emails">Email Addresses</Label>
              <Textarea
                id="emails"
                placeholder="john@gmail.com&#10;alice@gmail.com&#10;bob@gmail.com"
                rows={8}
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Add Recipients'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Method 2: Upload CSV</CardTitle>
          <CardDescription>
            Upload a .csv with email plus business details (name, address, etc.).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label
            htmlFor="csv-upload"
            className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors hover:bg-muted/50"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium">Click to upload CSV</span>
            <input
              id="csv-upload"
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleCsvUpload}
              disabled={loading}
            />
          </Label>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={() => navigate(`/campaigns/${id}/preview`)}>
        <FileUp className="mr-2 h-4 w-4" />
        Skip to Preview
      </Button>
    </div>
  )
}
