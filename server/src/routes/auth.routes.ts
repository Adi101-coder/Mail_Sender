import { Router } from 'express'
import { env } from '../config/env.js'
import { getUserId, requireAuth } from '../middleware/auth.middleware.js'
import {
  getGoogleAuthUrl,
  handleGoogleCallback,
} from '../modules/auth/auth.service.js'
import { getDashboardStats } from '../modules/campaign/campaign.service.js'
import { prisma } from '../lib/prisma.js'

const router = Router()

/** Initiate Google OAuth (POST variant per API spec). */
router.post('/google', (_req, res) => {
  const url = getGoogleAuthUrl()
  res.json({ url })
})

/** Initiate Google OAuth redirect. */
router.get('/google', (_req, res) => {
  res.redirect(getGoogleAuthUrl())
})

/** Google OAuth callback — store tokens and redirect to dashboard. */
router.get('/callback', async (req, res, next) => {
  try {
    const code = req.query.code as string | undefined
    if (!code) {
      res.redirect(`${env.CLIENT_URL}/login?error=missing_code`)
      return
    }

    const user = await handleGoogleCallback(code)
    req.session.userId = user.id

    req.session.save((err) => {
      if (err) {
        next(err)
        return
      }
      res.redirect(`${env.CLIENT_URL}/dashboard`)
    })
  } catch (error) {
    console.error('OAuth callback error:', error)
    res.redirect(`${env.CLIENT_URL}/login?error=auth_failed`)
  }
})

/** Return the currently authenticated user. */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req)
    const stats = await getDashboardStats(userId)
    res.json(stats)
  } catch (error) {
    next(error)
  }
})

/** Log out and destroy session. */
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid')
    res.json({ success: true })
  })
})

/** Disconnect Gmail account (delete user record). */
router.delete('/account', requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req)
    await prisma.user.delete({ where: { id: userId } })
    req.session.destroy(() => {
      res.clearCookie('connect.sid')
      res.json({ success: true })
    })
  } catch (error) {
    next(error)
  }
})

export default router
