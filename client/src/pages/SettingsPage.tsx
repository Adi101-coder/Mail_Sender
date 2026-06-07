import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export function SettingsPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleDisconnect = async () => {
    if (!confirm('Disconnect your Gmail account? All campaigns will be deleted.')) return
    setLoading(true)
    try {
      await api.deleteAccount()
      await logout()
      toast.success('Account disconnected')
      navigate('/login')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to disconnect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sending Limits</CardTitle>
          <CardDescription>Safety limits to prevent Gmail rate-limit issues.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Maximum 500 recipients per campaign</li>
            <li>Batch size: 25 emails per batch</li>
            <li>2-second delay between batches</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>Disconnect your Gmail account from this application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Disconnecting will remove your account and all associated campaign data.
            </AlertDescription>
          </Alert>
          <Button variant="destructive" onClick={handleDisconnect} disabled={loading}>
            {loading ? 'Disconnecting...' : 'Disconnect Gmail Account'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
