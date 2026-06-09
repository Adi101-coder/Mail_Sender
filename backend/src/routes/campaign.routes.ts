import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { getUserId, requireAuth } from '../middleware/auth.middleware.js'
import {
  createCampaign,
  getCampaignById,
  listCampaigns,
} from '../modules/campaign/campaign.service.js'
import {
  cancelScheduledSend,
  getCampaignSendStatus,
  getPersonalizedPreview,
  scheduleCampaignSend,
  sendCampaignEmails,
} from '../modules/email-sending/email-sending.service.js'
import { addRecipientsToCampaign } from '../modules/recipient/recipient.service.js'
import { parseRecipientCsv } from '../utils/csvParsing.js'
import { parseEmailText } from '../utils/emailValidation.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

const createCampaignSchema = z.object({
  campaignName: z.string().min(1).max(200),
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(50000),
})

const recipientsBodySchema = z.object({
  emails: z.array(z.string()).optional(),
  text: z.string().optional(),
})

const scheduleCampaignSchema = z.object({
  scheduledAt: z.string().datetime(),
})

router.use(requireAuth)

/** Create a new campaign. */
router.post('/', async (req, res, next) => {
  try {
    const data = createCampaignSchema.parse(req.body)
    const userId = getUserId(req)
    const campaign = await createCampaign({ userId, ...data })
    res.status(201).json(campaign)
  } catch (error) {
    next(error)
  }
})

/** List all campaigns for the user. */
router.get('/', async (req, res, next) => {
  try {
    const userId = getUserId(req)
    const campaigns = await listCampaigns(userId)
    res.json(campaigns)
  } catch (error) {
    next(error)
  }
})

/** Get a single campaign with recipients. */
router.get('/:id', async (req, res, next) => {
  try {
    const userId = getUserId(req)
    const campaign = await getCampaignById(userId, req.params.id)
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' })
      return
    }
    res.json(campaign)
  } catch (error) {
    next(error)
  }
})

/** Add recipients via JSON body or CSV upload. */
router.post('/:id/recipients', upload.single('file'), async (req, res, next) => {
  try {
    const userId = getUserId(req)
    const campaign = await getCampaignById(userId, req.params.id)
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' })
      return
    }

    let recipientRows: Array<{ email: string; metadata: Record<string, string> }> = []

    if (req.file) {
      const csvContent = req.file.buffer.toString('utf-8')
      recipientRows = parseRecipientCsv(csvContent)
    } else {
      const body = recipientsBodySchema.parse(req.body)
      if (body.text) {
        recipientRows = parseEmailText(body.text).map((email) => ({
          email,
          metadata: {},
        }))
      } else if (body.emails) {
        recipientRows = body.emails.map((email) => ({ email, metadata: {} }))
      } else {
        res.status(400).json({ error: 'Provide emails, text, or a CSV file' })
        return
      }
    }

    const result = await addRecipientsToCampaign(campaign.id, recipientRows)
    const updated = await getCampaignById(userId, campaign.id)
    res.json({ ...result, campaign: updated })
  } catch (error) {
    next(error)
  }
})

/** Schedule campaign emails for a future time. */
router.post('/:id/schedule', async (req, res, next) => {
  try {
    const userId = getUserId(req)
    const { scheduledAt } = scheduleCampaignSchema.parse(req.body)
    const status = await scheduleCampaignSend(userId, req.params.id, new Date(scheduledAt))
    res.json({
      message: 'Campaign scheduled',
      campaignId: req.params.id,
      scheduledAt,
      ...status,
    })
  } catch (error) {
    next(error)
  }
})

/** Cancel a scheduled campaign send. */
router.delete('/:id/schedule', async (req, res, next) => {
  try {
    const userId = getUserId(req)
    const status = await cancelScheduledSend(userId, req.params.id)
    res.json({ message: 'Schedule cancelled', ...status })
  } catch (error) {
    next(error)
  }
})

/** Start sending campaign emails (runs asynchronously). */
router.post('/:id/send', async (req, res, next) => {
  try {
    const userId = getUserId(req)
    const campaign = await getCampaignById(userId, req.params.id)
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' })
      return
    }

    if (campaign.status === 'Scheduled') {
      await cancelScheduledSend(userId, campaign.id)
    }

    // Run sending in background so the client can poll status
    sendCampaignEmails(userId, campaign.id).catch((err) => {
      console.error('Campaign send failed:', err)
    })

    res.json({ message: 'Campaign sending started', campaignId: campaign.id })
  } catch (error) {
    next(error)
  }
})

/** Preview AI-personalized email for a single recipient. */
router.get('/:id/recipients/:recipientId/preview', async (req, res, next) => {
  try {
    const userId = getUserId(req)
    const preview = await getPersonalizedPreview(userId, req.params.id, req.params.recipientId)
    res.json(preview)
  } catch (error) {
    next(error)
  }
})

/** Get campaign send progress. */
router.get('/:id/status', async (req, res, next) => {
  try {
    const userId = getUserId(req)
    const status = await getCampaignSendStatus(userId, req.params.id)
    res.json(status)
  } catch (error) {
    next(error)
  }
})

export default router
