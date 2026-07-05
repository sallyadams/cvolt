import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

// Cache on globalThis in all environments — prevents connection pool exhaustion
// in serverless (Vercel) where module cache may be reused across invocations.
globalForPrisma.prisma = prisma