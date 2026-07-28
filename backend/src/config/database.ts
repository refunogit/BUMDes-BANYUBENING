import { PrismaClient } from '@prisma/client';
import { logger } from './pino';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: isDev() ? ['query', 'error', 'warn'] : ['error'],
  });

function isDev() {
  return process.env.NODE_ENV !== 'production';
}

if (!isDev()) {
  // avoid hot reload issue in dev
} else {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected via Prisma');
  } catch (error) {
    logger.error({ error }, '❌ Database connection failed');
    throw error;
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
