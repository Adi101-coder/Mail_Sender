import { createApp } from './app.js'
import { env } from './config/env.js'
import { connectDatabase } from './lib/mongodb.js'
import { startCampaignScheduler } from './modules/scheduling/scheduler.service.js'

async function start() {
  console.log('[Server] connecting to database...')
  await connectDatabase()
  console.log('[Server] database connected')
  startCampaignScheduler()

  const app = createApp()

  const server = app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`)
  })

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `Port ${env.PORT} is already in use. Stop the other process and retry.\n` +
          `Windows: netstat -ano | findstr :${env.PORT}  then  taskkill /PID <pid> /F`,
      )
      process.exit(1)
    }

    console.error('Failed to start server:', error)
    process.exit(1)
  })
}

start().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
