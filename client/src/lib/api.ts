/** Production API URL (Railway). Local dev uses Vite proxy via `/api`. */
const API_BASE = import.meta.env.VITE_API_URL ?? '/api'
console.log('[API] base URL:', API_BASE)
const REQUEST_TIMEOUT_MS = 15_000

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status >= 500
  }

  return error instanceof TypeError || (error instanceof DOMException && error.name === 'TimeoutError')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`
  const method = options.method ?? 'GET'
  console.log(`[API] → ${method} ${url}`)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    console.warn(`[API] ⏱ request timed out after ${REQUEST_TIMEOUT_MS}ms: ${method} ${url}`)
    controller.abort()
  }, REQUEST_TIMEOUT_MS)

  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    })

    console.log(`[API] ← ${response.status} ${method} ${url}`)

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      console.error(`[API] ✗ ${response.status} ${method} ${url}`, data)
      throw new ApiError(data.error ?? 'Request failed', response.status)
    }

    console.log(`[API] ✓ ${method} ${url}`, data)
    return data as T
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error(`[API] ✗ aborted/timed out: ${method} ${url}`)
      throw new ApiError('Request timed out', 408)
    }

    console.error(`[API] ✗ network error: ${method} ${url}`, error)
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

async function requestWithRetry<T>(path: string, options: RequestInit = {}): Promise<T> {
  const maxAttempts = 5

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`[API] retry attempt ${attempt}/${maxAttempts}: ${options.method ?? 'GET'} ${path}`)
      }
      return await request<T>(path, options)
    } catch (error) {
      if (!isRetryableError(error) || attempt === maxAttempts) {
        throw error
      }

      console.warn(`[API] retrying in ${attempt}s after error on ${path}`, error)
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    }
  }

  throw new Error('Request failed')
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

  scheduleCampaign: (id: string, scheduledAt: string) =>
    request<import('@/types').CampaignSendStatus & { message: string; scheduledAt: string }>(
      `/campaigns/${id}/schedule`,
      { method: 'POST', body: JSON.stringify({ scheduledAt }) },
    ),

  cancelSchedule: (id: string) =>
    request<import('@/types').CampaignSendStatus & { message: string }>(
      `/campaigns/${id}/schedule`,
      { method: 'DELETE' },
    ),

  getCampaignStatus: (id: string) =>
    request<import('@/types').CampaignSendStatus>(`/campaigns/${id}/status`),

  getPersonalizedPreview: (campaignId: string, recipientId: string) =>
    request<import('@/types').PersonalizedPreview>(
      `/campaigns/${campaignId}/recipients/${recipientId}/preview`,
    ),
}
