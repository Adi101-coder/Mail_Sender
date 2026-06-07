import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { CampaignsPage } from '@/pages/CampaignsPage'
import { CreateCampaignPage } from '@/pages/CreateCampaignPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { GmailAccountPage } from '@/pages/GmailAccountPage'
import { LoginPage } from '@/pages/LoginPage'
import { PreviewPage } from '@/pages/PreviewPage'
import { SendingStatusPage } from '@/pages/SendingStatusPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { UploadRecipientsPage } from '@/pages/UploadRecipientsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/campaigns/new" element={<CreateCampaignPage />} />
          <Route path="/campaigns/:id/recipients" element={<UploadRecipientsPage />} />
          <Route path="/campaigns/:id/preview" element={<PreviewPage />} />
          <Route path="/campaigns/:id/sending" element={<SendingStatusPage />} />
          <Route path="/gmail" element={<GmailAccountPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
