import type { NextFunction, Request, Response } from 'express'

declare module 'express-session' {
  interface SessionData {
    userId?: string
  }
}

/** Require an authenticated session for protected routes. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }
  next()
}

export function getUserId(req: Request): string {
  const userId = req.session.userId
  if (!userId) {
    throw new Error('User not authenticated')
  }
  return userId
}
