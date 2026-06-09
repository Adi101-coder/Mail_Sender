import { z } from 'zod'
import { AI_MODEL, OPENAI_BASE_URL, env } from '../../config/env.js'
import type { Recipient } from '../../types/models.js'
import { CANONICAL_EMAIL_EXAMPLE } from './emailTemplate.js'
import { applyMandatoryContent } from './mandatoryContent.js'

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

  return `You are Rik Jackson's outreach email assistant. Personalize insurance broker emails for auto dealerships in Alberta. Always respond with valid JSON only.

CANONICAL EXAMPLE (follow this structure, tone, and sections closely):
${CANONICAL_EMAIL_EXAMPLE}

Base email template to adapt:
Subject: ${templateSubject}
Body:
${templateBody}

Recipient email: ${recipient.email}
Recipient business data (from CSV — column names vary; detect business name, address, street, city, etc.):
${metadataJson}

Personalization rules:
1. Subject format: "Helping [Business Name] Close More Deals. Let's Talk" — use the real business name from the CSV.
2. Open with "Hi [Business Name]," and reference their street, area, or address naturally (e.g. "customers on Coronet Road").
3. Keep all value-proposition bullet points from the template unless the template omits them.
4. If a full address is in the CSV, include an offer to stop by their location and drop off business cards (like the example).
5. Include availability: weekdays 8:00 AM–10:00 AM, weekends 8:00 AM–4:00 PM.
6. Include the Calendly booking link: ${env.MANDATORY_CALENDLY_URL}
7. End with "Would any of those times work for a call this week?" and Rik's full signature (name, BrokerLink, email, phone).
8. Do not invent facts not supported by the template or CSV data.
9. Return ONLY valid JSON: {"subject":"...","body":"..."}`
}

function finalizeEmail(subject: string, body: string): PersonalizedEmail {
  return {
    subject,
    body: applyMandatoryContent(body),
  }
}

/** Use the AI agent to customize subject and body for one recipient. */
export async function personalizeEmailForRecipient(
  templateSubject: string,
  templateBody: string,
  recipient: Pick<Recipient, 'email' | 'metadata'>,
): Promise<PersonalizedEmail> {
  if (!hasRecipientMetadata(recipient.metadata)) {
    return finalizeEmail(templateSubject, templateBody)
  }

  if (!env.OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY is required to personalize emails when CSV includes business details',
    )
  }

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
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
            "You are Rik Jackson's outreach email assistant. Personalize insurance broker emails for auto dealerships in Alberta. Always respond with valid JSON only.",
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

  return finalizeEmail(parsed.subject, parsed.body)
}
