import { env } from '../../config/env.js'
import {
  SENDER_SIGNATURE,
  buildSchedulingOptionsBlock,
  buildSignatureBlock,
} from './emailTemplate.js'

function hasCalendlyLink(body: string): boolean {
  return body.includes(env.MANDATORY_CALENDLY_URL)
}

function hasSignature(body: string): boolean {
  return body.includes(SENDER_SIGNATURE.name) && body.includes(SENDER_SIGNATURE.email)
}

/** Ensure every email body includes scheduling, Calendly, and Rik's signature. */
export function applyMandatoryContent(body: string): string {
  let result = body.trim()
  const additions: string[] = []

  if (!hasCalendlyLink(result)) {
    additions.push(buildSchedulingOptionsBlock())
  }

  if (!hasSignature(result)) {
    additions.push(buildSignatureBlock())
  } else if (!result.includes('Would any of those times work')) {
    const signatureIndex = result.indexOf(SENDER_SIGNATURE.name)
    if (signatureIndex > 0) {
      const beforeSignature = result.slice(0, signatureIndex).trimEnd()
      const signaturePart = result.slice(signatureIndex).trim()
      result = `${beforeSignature}\n\nWould any of those times work for a call this week?\n\n${signaturePart}`
    }
  }

  if (additions.length === 0) {
    return result
  }

  return `${result}\n\n${additions.join('\n\n')}`
}
