/** Production API URL (Railway). Local dev uses Vite proxy via `/api`. */
const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error ?? 'Request failed')
  }

  return data as T
}

export const api = {
  getGoogleAuthUrl: () => request<{ url: string }>('/auth/google', { method: 'POST' }),

  getMe: () => request<import('@/types').DashboardStats>('/auth/me'),

  logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),

  deleteAccount: () => request<{ success: boolean }>('/auth/account', { method: 'DELETE' }),

  createCampaign: (data: { campaignName: string; subject: string; body: string }) =>
    request<import('@/types').Campaign>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCampaigns: () => request<import('@/types').Campaign[]>('/campaigns'),

  getCampaign: (id: string) => request<import('@/types').Campaign>(`/campaigns/${id}`),

  addRecipientsText: (id: string, text: string) =>
    request<{ added: number; invalid: string[]; campaign: import('@/types').Campaign }>(
      `/campaigns/${id}/recipients`,
      { method: 'POST', body: JSON.stringify({ text }) },
    ),

  addRecipientsCsv: (id: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request<{ added: number; invalid: string[]; campaign: import('@/types').Campaign }>(
      `/campaigns/${id}/recipients`,
      { method: 'POST', body: formData },
    )
  },

  sendCampaign: (id: string) =>
    request<{ message: string; campaignId: string }>(`/campaigns/${id}/send`, {
      method: 'POST',
    }),

  getCampaignStatus: (id: string) =>
    request<import('@/types').CampaignSendStatus>(`/campaigns/${id}/status`),
}
