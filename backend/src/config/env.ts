import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { z } from 'zod'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  SESSION_SECRET: z.string().min(16),
  ENCRYPTION_KEY: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_REDIRECT_URI: z.string().url(),
  MONGODB_URI: z.string().min(1),
  MONGODB_DB_NAME: z.string().min(1).default('mail_sender'),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_BASE_URL: z.string().url().optional(),
  MANDATORY_CALENDLY_URL: z
    .string()
    .url()
    .default('https://calendly.com/rik-insurance-broker/30min'),
})

export const env = envSchema.parse(process.env)

/** Availability windows that must appear in every outbound email. */
export const MANDATORY_AVAILABILITY = {
  weekday: '8AM - 10AM, Mon - Fri',
  saturday: '8AM - 4PM, Sat',
} as const

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
]

export const MAX_RECIPIENTS_PER_CAMPAIGN = 500
export const BATCH_SIZE = 25
export const BATCH_DELAY_MS = 2000
export const SCHEDULER_POLL_INTERVAL_MS = 30_000
function resolveOpenAiBaseUrl(): string {
  if (process.env.OPENAI_BASE_URL) return process.env.OPENAI_BASE_URL
  const key = process.env.OPENAI_API_KEY ?? ''
  if (key.startsWith('sk-or-')) return 'https://openrouter.ai/api/v1'
  return 'https://api.openai.com/v1'
}

export const OPENAI_BASE_URL = resolveOpenAiBaseUrl()
export const AI_MODEL =
  process.env.AI_MODEL ??
  (process.env.OPENAI_API_KEY?.startsWith('sk-or-') ? 'openai/gpt-4o-mini' : 'gpt-4o-mini')
