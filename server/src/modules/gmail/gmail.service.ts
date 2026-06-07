import type { gmail_v1 } from 'googleapis'
import { getGmailClientForUser } from '../auth/auth.service.js'

interface SendEmailParams {
  userId: string
  to: string
  subject: string
  body: string
}

/** Build RFC 2822 raw message and send via Gmail API. */
export async function sendGmailMessage({
  userId,
  to,
  subject,
  body,
}: SendEmailParams): Promise<string> {
  const gmail = await getGmailClientForUser(userId)

  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\r\n')

  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    } satisfies gmail_v1.Schema$Message,
  })

  if (!response.data.id) {
    throw new Error('Gmail API did not return a message ID')
  }

  return response.data.id
}
