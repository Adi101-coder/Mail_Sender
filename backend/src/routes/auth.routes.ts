import { Router } from 'express'
import { env } from '../config/env.js'
import { getUserId, requireAuth } from '../middleware/auth.middleware.js'
import {
  deleteUserAccount,
  getGoogleAuthUrl,
  handleGoogleCallback,
} from '../modules/auth/auth.service.js'
import { getDashboardStats } from '../modules/campaign/campaign.service.js'
import { getSessionCookieOptions } from '../utils/sessionCookie.js'

const router = Router()

/** Initiate Google OAuth (POST variant per API spec). */
router.post('/google', (_req, res) => {
  console.log('[Auth] POST /google — generating OAuth URL')
  const url = getGoogleAuthUrl()
  console.log('[Auth] POST /google — URL ready')
  res.json({ url })
})

/** Initiate Google OAuth redirect. */
router.get('/google', (_req, res) => {
  res.redirect(getGoogleAuthUrl())
})

/** Google OAuth callback — store tokens and redirect to dashboard. */
router.get('/callback', async (req, res, next) => {
  console.log('[Auth] GET /callback — received OAuth redirect')
  try {
    const code = req.query.code as string | undefined
    if (!code) {
      console.warn('[Auth] GET /callback — missing code, redirecting to login')
      res.redirect(`${env.CLIENT_URL}/login?error=missing_code`)
      return
    }

    console.log('[Auth] GET /callback — exchanging code for tokens...')
    const user = await handleGoogleCallback(code)
    console.log('[Auth] GET /callback — user upserted:', user.email, 'id:', user.id)
    req.session.userId = user.id

    req.session.save((err) => {
      if (err) {
        console.error('[Auth] GET /callback — session save failed:', err)
        next(err)
        return
      }
      console.log('[Auth] GET /callback — session saved, redirecting to dashboard')
      res.redirect(`${env.CLIENT_URL}/dashboard`)
    })
  } catch (error) {
    console.error('[Auth] GET /callback — error:', error)
    res.redirect(`${env.CLIENT_URL}/login?error=auth_failed`)
  }
})

/** Return the currently authenticated user, or anonymous stats when logged out. */
router.get('/me', async (req, res, next) => {
  console.log('[Auth] GET /me — session userId:', req.session.userId ?? '(none)')
  try {
    if (!req.session.userId) {
      console.log('[Auth] GET /me — no session, returning anonymous stats')
      res.json({ campaignCount: 0, sentCount: 0, user: null })
      return
    }

    const userId = getUserId(req)
    console.log('[Auth] GET /me — fetching dashboard stats for user:', userId)
    const stats = await getDashboardStats(userId)
    console.log('[Auth] GET /me — success, user:', stats.user?.email ?? '(unknown)')
    res.json(stats)
  } catch (error) {
    console.error('[Auth] GET /me — error:', error)
    next(error)
  }
})

/** Log out and destroy session. */
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid', getSessionCookieOptions())
    res.json({ success: true })
  })
})

/** Disconnect Gmail account (delete user record). */
router.delete('/account', requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req)
    await deleteUserAccount(userId)
    req.session.destroy(() => {
      res.clearCookie('connect.sid', getSessionCookieOptions())
      res.json({ success: true })
    })
  } catch (error) {
    next(error)
  }
})

export default router
