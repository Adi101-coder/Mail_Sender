import { google } from 'googleapis'
import { env, GOOGLE_SCOPES } from '../../config/env.js'
import { decrypt, encrypt } from '../../utils/crypto.js'
import { prisma } from '../../lib/prisma.js'

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  )
}

/** Build the Google OAuth consent URL. */
export function getGoogleAuthUrl(state?: string): string {
  const client = createOAuth2Client()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: GOOGLE_SCOPES,
    state,
  })
}

/** Exchange authorization code for tokens and upsert the user record. */
export async function handleGoogleCallback(code: string) {
  const client = createOAuth2Client()
  const { tokens } = await client.getToken(code)

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Missing OAuth tokens from Google')
  }

  client.setCredentials(tokens)

  const oauth2 = google.oauth2({ version: 'v2', auth: client })
  const { data: profile } = await oauth2.userinfo.get()

  if (!profile.id || !profile.email) {
    throw new Error('Unable to retrieve Google profile')
  }

  const user = await prisma.user.upsert({
    where: { googleId: profile.id },
    update: {
      name: profile.name ?? null,
      email: profile.email,
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
    },
    create: {
      googleId: profile.id,
      name: profile.name ?? null,
      email: profile.email,
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
    },
  })

  return user
}

/** Get a Gmail API client with refreshed credentials for a user. */
export async function getGmailClientForUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  const client = createOAuth2Client()
  client.setCredentials({
    access_token: decrypt(user.accessToken),
    refresh_token: decrypt(user.refreshToken),
  })

  client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await prisma.user.update({
        where: { id: userId },
        data: { accessToken: encrypt(tokens.access_token) },
      })
    }
    if (tokens.refresh_token) {
      await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: encrypt(tokens.refresh_token) },
      })
    }
  })

  return google.gmail({ version: 'v1', auth: client })
}
