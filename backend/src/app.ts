import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import session from 'express-session'
import { env } from './config/env.js'
import { errorHandler } from './middleware/error.middleware.js'
import authRoutes from './routes/auth.routes.js'
import campaignRoutes from './routes/campaign.routes.js'
import { getSessionCookieOptions } from './utils/sessionCookie.js'

export function createApp() {
  const app = express()

  // Required behind Railway/reverse proxy for secure cookies
  app.set('trust proxy', 1)

  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())

  const cookieOptions = getSessionCookieOptions()

  app.use(
    session({
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    }),
  )

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/campaigns', campaignRoutes)

  app.use(errorHandler)

  return app
}
