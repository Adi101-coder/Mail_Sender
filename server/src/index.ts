import { createApp } from './app.js'
import { env } from './config/env.js'
import { connectDatabase } from './lib/mongodb.js'

async function start() {
  await connectDatabase()

  const app = createApp()

  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`)
  })
}

start().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
