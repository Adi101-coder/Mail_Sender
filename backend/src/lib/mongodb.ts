import mongoose from 'mongoose'
import { env } from '../config/env.js'
import {
  getMongoAuthHelpMessage,
  getMongoUriDiagnostics,
  normalizeMongoUri,
} from './mongoUri.js'

/** Connect to MongoDB (local or Atlas via mongodb+srv URI). */
export async function connectDatabase(): Promise<void> {
  const diagnostic = getMongoUriDiagnostics(env.MONGODB_URI)
  if (diagnostic) {
    throw new Error(diagnostic)
  }

  const uri = normalizeMongoUri(env.MONGODB_URI, env.MONGODB_DB_NAME)

  mongoose.set('strictQuery', true)

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      maxPoolSize: 10,
    })

    console.log(`Connected to MongoDB (${mongoose.connection.host}/${mongoose.connection.name})`)
  } catch (error) {
    const isAuthError =
      error !== null &&
      typeof error === 'object' &&
      ('code' in error && error.code === 8000 ||
        (error instanceof Error &&
          (error.message.includes('bad auth') ||
            error.message.includes('authentication failed'))))

    if (isAuthError) {
      const message = error instanceof Error ? error.message : 'authentication failed'
      throw new Error(`${getMongoAuthHelpMessage()}\n\nOriginal error: ${message}`)
    }

    throw error
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect()
}
