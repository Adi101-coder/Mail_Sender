import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      toast.error('Google sign-in failed. Please try again.')
    }
  }, [searchParams])

  const handleSignIn = async () => {
    console.log('[Auth] Sign in clicked — fetching Google OAuth URL')
    try {
      const { url } = await api.getGoogleAuthUrl()
      console.log('[Auth] Got OAuth URL, redirecting to Google...')
      window.location.href = url
    } catch (error) {
      console.error('[Auth] Failed to get Google OAuth URL:', error)
      toast.error('Unable to start Google sign-in')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Gmail Bulk Mail Sender</CardTitle>
          <CardDescription>
            Connect your Gmail account to create campaigns and send bulk emails securely.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTitle>Phase 1 MVP</AlertTitle>
            <AlertDescription>
              Connect Gmail, create templates, upload recipients, preview, and send — all from your
              own Google account.
            </AlertDescription>
          </Alert>
          <Button className="w-full" size="lg" onClick={handleSignIn}>
            Sign in with Google
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => navigate('/')}>
            Learn more
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
