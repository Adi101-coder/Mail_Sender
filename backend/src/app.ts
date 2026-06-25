import cookieParser from 'cookie-parser'
import cors from 'cors'
import MongoStore from 'connect-mongo'
import express from 'express'
import session from 'express-session'
import { env } from './config/env.js'
import { normalizeMongoUri } from './lib/mongoUri.js'
import { errorHandler } from './middleware/error.middleware.js'
import authRoutes from './routes/auth.routes.js'
import campaignRoutes from './routes/campaign.routes.js'
import { getSessionCookieOptions } from './utils/sessionCookie.js'

export function createApp() {
  const app = express()

  // Required behind Railway/reverse proxy for secure cookies
  app.set('trust proxy', 1)

  // Health/info routes skip session middleware so startup checks stay fast.
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.get('/', (_req, res) => {
    res.json({
      name: 'Mail Sender API',
      health: '/api/health',
      docs: 'See README.md for API endpoints',
    })
  })

  app.use(
    cors({
      origin(origin, callback) {
        // Allow non-browser clients (curl, health checks).
        if (!origin) {
          callback(null, true)
          return
        }

        // Local dev: Vite may use 5174 if 5173 is busy — allow any localhost port.
        if (env.NODE_ENV === 'development' && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
          callback(null, true)
          return
        }

        if (origin === env.CLIENT_URL) {
          callback(null, true)
          return
        }

        callback(new Error(`CORS blocked origin: ${origin}`))
      },
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())

  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[Server] ${req.method} ${req.path}`)
    }
    next()
  })

  const cookieOptions = getSessionCookieOptions()
  const sessionStore =
    env.NODE_ENV === 'development'
      ? undefined
      : MongoStore.create({
          mongoUrl: normalizeMongoUri(env.MONGODB_URI, env.MONGODB_DB_NAME),
        })

  app.use(
    session({
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    }),
  )

  app.use('/api/auth', authRoutes)
  app.use('/api/campaigns', campaignRoutes)

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  app.use(errorHandler)

  return app
}
