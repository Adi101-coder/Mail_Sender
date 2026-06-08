const PLACEHOLDER_PATTERNS = [
  '<db_password>',
  '<password>',
  'USERNAME',
  'PASSWORD',
  'YOUR_DB_PASSWORD',
  'REPLACE_WITH_YOUR_PASSWORD',
]

/** Ensure the URI includes a database name (defaults to mail_sender). */
export function normalizeMongoUri(uri: string, dbName = 'mail_sender'): string {
  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/[^/?#]+)(\/[^?#]*)?(\?.*)?$/i)
  if (!match) return uri

  const [, base, path = '', query = ''] = match
  const hasDbName = path.length > 1

  if (hasDbName) return uri

  const params = query ? query.slice(1) : ''
  const defaultParams = 'retryWrites=true&w=majority'
  const mergedParams = params
    ? params.includes('retryWrites=')
      ? params
      : `${params}&${defaultParams}`
    : defaultParams

  return `${base}/${dbName}?${mergedParams}`
}

export function getMongoUriDiagnostics(uri: string): string | null {
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (uri.includes(pattern)) {
      return `MONGODB_URI still contains "${pattern}". Replace it with your real Atlas database user password.`
    }
  }

  try {
    const parsed = new URL(uri.replace(/^mongodb(\+srv)?:\/\//, 'https://'))
    if (!parsed.username || !parsed.password) {
      return 'MONGODB_URI is missing a username or password. Check your Atlas connection string.'
    }
  } catch {
    return 'MONGODB_URI format is invalid. Copy the string from Atlas → Connect → Drivers.'
  }

  return null
}

export function getMongoAuthHelpMessage(): string {
  return [
    'MongoDB authentication failed. Common fixes:',
    '1. Replace <db_password> with your Atlas database user password (not your Atlas login).',
    '2. If the password has special characters (@, #, :, /, etc.), URL-encode it.',
    '3. In Atlas → Database Access, confirm the user exists and reset the password if needed.',
    '4. Ensure Network Access allows your current IP address.',
  ].join('\n')
}
