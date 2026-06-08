import { env } from '../config/env.js'

export function getSessionCookieOptions() {
  return {
    secure: env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
  }
}
