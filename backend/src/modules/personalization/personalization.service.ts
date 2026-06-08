import { z } from 'zod'
import { AI_MODEL, env } from '../../config/env.js'
import type { Recipient } from '../../types/models.js'

export interface PersonalizedEmail {
  subject: string
  body: string
}

const personalizedEmailSchema = z.object({
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(50000),
})

function hasRecipientMetadata(metadata: Record<string, string>): boolean {
  return Object.keys(metadata).length > 0
}

function buildPersonalizationPrompt(
  templateSubject: string,
  templateBody: string,
  recipient: Pick<Recipient, 'email' | 'metadata'>,
): string {
  const metadataJson = JSON.stringify(recipient.metadata, null, 2)

  return `You personalize outreach emails for individual businesses.

Base email template:
Subject: ${templateSubject}
Body:
${templateBody}

Recipient email: ${recipient.email}
Recipient business data (from CSV — column names vary, interpret them yourself):
${metadataJson}

Instructions:
1. Read every field in the recipient data and use relevant details naturally (business name, address, city, industry, services, owner name, website, notes, etc.).
2. Keep the same overall goal, tone, and call-to-action as the base template.
3. Do not invent facts that are not supported by the template or recipient data.
4. Make each email feel written specifically for this business, not like a mass mail merge.
5. Return ONLY valid JSON with this exact shape: {"subject":"...","body":"..."}`
}

/** Use the AI agent to customize subject and body for one recipient. */
export async function personalizeEmailForRecipient(
  templateSubject: string,
  templateBody: string,
  recipient: Pick<Recipient, 'email' | 'metadata'>,
): Promise<PersonalizedEmail> {
  if (!hasRecipientMetadata(recipient.metadata)) {
    return { subject: templateSubject, body: templateBody }
  }

  if (!env.OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY is required to personalize emails when CSV includes business details',
    )
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are an expert B2B email copywriter. You personalize emails using provided business data. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: buildPersonalizationPrompt(templateSubject, templateBody, recipient),
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`AI personalization failed: ${errorBody}`)
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('AI personalization returned an empty response')
  }

  const parsed = personalizedEmailSchema.parse(JSON.parse(content))

  return parsed
}
