import { google } from 'googleapis'
import { env, GOOGLE_SCOPES } from '../../config/env.js'
import { store } from '../../lib/store.js'
import { decrypt, encrypt } from '../../utils/crypto.js'

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
  console.log('[Auth] handleGoogleCallback — exchanging code with Google...')
  const client = createOAuth2Client()
  const { tokens } = await client.getToken(code)
  console.log('[Auth] handleGoogleCallback — tokens received (access:', !!tokens.access_token, 'refresh:', !!tokens.refresh_token, ')')

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Missing OAuth tokens from Google')
  }

  client.setCredentials(tokens)

  console.log('[Auth] handleGoogleCallback — fetching Google profile...')
  const oauth2 = google.oauth2({ version: 'v2', auth: client })
  const { data: profile } = await oauth2.userinfo.get()
  console.log('[Auth] handleGoogleCallback — profile:', profile.email)

  if (!profile.id || !profile.email) {
    throw new Error('Unable to retrieve Google profile')
  }

  console.log('[Auth] handleGoogleCallback — upserting user in DB...')
  return store.upsertUser({
    googleId: profile.id,
    name: profile.name ?? null,
    email: profile.email,
    accessToken: encrypt(tokens.access_token),
    refreshToken: encrypt(tokens.refresh_token),
  })
}

/** Get a Gmail API client with refreshed credentials for a user. */
export async function getGmailClientForUser(userId: string) {
  const user = await store.findUserById(userId)
  if (!user) throw new Error('User not found')

  const client = createOAuth2Client()
  client.setCredentials({
    access_token: decrypt(user.accessToken),
    refresh_token: decrypt(user.refreshToken),
  })

  client.on('tokens', (tokens) => {
    store
      .updateUserTokens(userId, {
        accessToken: tokens.access_token ? encrypt(tokens.access_token) : undefined,
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
      })
      .catch((err) => console.error('Failed to persist refreshed tokens:', err))
  })

  return google.gmail({ version: 'v1', auth: client })
}

/** Remove user and all associated data from the database. */
export async function deleteUserAccount(userId: string): Promise<void> {
  await store.deleteUser(userId)
}
