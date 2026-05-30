import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaResetTs: number | undefined
}

// Force new PrismaClient every 30 seconds in development to handle database resets
const RESET_INTERVAL = 30000
const now = Date.now()
const lastReset = globalForPrisma.prismaResetTs ?? 0

if (process.env.NODE_ENV !== 'production' && globalForPrisma.prisma && (now - lastReset) > RESET_INTERVAL) {
  try {
    globalForPrisma.prisma.$disconnect()
  } catch {}
  globalForPrisma.prisma = undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
  globalForPrisma.prismaResetTs = Date.now()
}
