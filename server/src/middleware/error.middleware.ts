import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

/** Global error handler for API routes. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.flatten().fieldErrors,
    })
    return
  }

  if (err instanceof Error) {
    res.status(400).json({ error: err.message })
    return
  }

  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
}
