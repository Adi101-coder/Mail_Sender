import mongoose from 'mongoose'
import { env } from '../config/env.js'

/** Connect to MongoDB (local or Atlas via mongodb+srv URI). */
export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true)

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
  })

  console.log(`Connected to MongoDB (${mongoose.connection.host})`)
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect()
}
