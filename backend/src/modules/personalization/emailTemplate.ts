import { MANDATORY_AVAILABILITY, env } from '../../config/env.js'

export const SENDER_SIGNATURE = {
  name: 'Rik Jackson',
  company: 'BrokerLink',
  email: 'rikjackson@brokerlink.ca',
  phone: '(780) 474-8911 ext. 81734',
} as const

export const DEFAULT_CAMPAIGN_SUBJECT =
  "Helping {{business_name}} Close More Deals. Let's Talk"

export const DEFAULT_CAMPAIGN_BODY = `Hi {{business_name}},

I'll keep this brief. I know you're busy helping customers on {{street_or_area}}.

My name is Rik Jackson, and I'm an insurance broker with BrokerLink working directly with auto dealerships across Alberta to help their customers secure auto insurance quickly, so nothing holds up a sale.

Here's what I bring to the table:
- Partnered with 22+ insurance companies across Alberta
- Best rates guaranteed. I do the shopping for you
- Fast turnaround so your customers drive away sooner
- Current promotion: clients receive a gift card with every policy placed through me

I'd love to connect on a quick 15-minute call to show you how this fits into your current process. I'm available weekdays from 8:00 AM to 10:00 AM, and weekends from 8:00 AM to 4:00 PM.

You can also book a time that works for you here: ${env.MANDATORY_CALENDLY_URL}

I'm also happy to stop by your location at {{full_address}} and drop off some business cards for your team.

Would any of those times work for a call this week?

Looking forward to connecting,

${SENDER_SIGNATURE.name}
${SENDER_SIGNATURE.company}
Direct: ${SENDER_SIGNATURE.email}
Phone: ${SENDER_SIGNATURE.phone}`

/** Canonical example the AI should mirror when personalizing. */
export const CANONICAL_EMAIL_EXAMPLE = `Subject: Helping XYZ business Close More Deals. Let's Talk

Hi XYZ business,

I'll keep this brief. I know you're busy helping customers on Coronet Road.

My name is Rik Jackson, and I'm an insurance broker with BrokerLink working directly with auto dealerships across Alberta to help their customers secure auto insurance quickly, so nothing holds up a sale.

Here's what I bring to the table:
- Partnered with 22+ insurance companies across Alberta
- Best rates guaranteed. I do the shopping for you
- Fast turnaround so your customers drive away sooner
- Current promotion: clients receive a gift card with every policy placed through me

I'd love to connect on a quick 15-minute call to show you how this fits into your current process. I'm available weekdays from 8:00 AM to 10:00 AM, and weekends from 8:00 AM to 4:00 PM.

You can also book a time that works for you here: ${env.MANDATORY_CALENDLY_URL}

I'm also happy to stop by your location at 8647 Coronet Road and drop off some business cards for your team.

Would any of those times work for a call this week?

Looking forward to connecting,

${SENDER_SIGNATURE.name}
${SENDER_SIGNATURE.company}
Direct: ${SENDER_SIGNATURE.email}
Phone: ${SENDER_SIGNATURE.phone}`

export function buildSignatureBlock(): string {
  return `Looking forward to connecting,

${SENDER_SIGNATURE.name}
${SENDER_SIGNATURE.company}
Direct: ${SENDER_SIGNATURE.email}
Phone: ${SENDER_SIGNATURE.phone}`
}

export function buildSchedulingOptionsBlock(): string {
  return `You can also book a time that works for you here: ${env.MANDATORY_CALENDLY_URL}
Alternatively, feel free to call me during my available hours (${MANDATORY_AVAILABILITY.weekday}; ${MANDATORY_AVAILABILITY.saturday}).`
}
