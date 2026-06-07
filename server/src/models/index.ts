import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: null },
    email: { type: String, required: true, unique: true },
    googleId: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

export const UserModel = mongoose.model('User', userSchema)

const campaignSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    campaignName: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    status: {
      type: String,
      enum: ['Draft', 'Sending', 'Completed', 'Failed'],
      default: 'Draft',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

export const CampaignModel = mongoose.model('Campaign', campaignSchema)

const recipientSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    email: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Sent', 'Failed'],
      default: 'Pending',
    },
    sentAt: { type: Date, default: null },
  },
  { timestamps: false },
)

export const RecipientModel = mongoose.model('Recipient', recipientSchema)

const emailLogSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipient',
      required: true,
      index: true,
    },
    gmailMessageId: { type: String, default: null },
    status: { type: String, enum: ['Sent', 'Failed'], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

export const EmailLogModel = mongoose.model('EmailLog', emailLogSchema)
