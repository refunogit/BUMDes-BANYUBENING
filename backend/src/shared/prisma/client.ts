import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { logger } from '../logger';

// Defensive enterprise zero-network configuration:
// If local engines exist in backend/prisma/engines, ensure environment variables point to them.
const enginesDir = path.resolve(__dirname, '../../../prisma/engines');
const schemaEnginePath = path.join(enginesDir, 'schema-engine');
const queryEnginePath = path.join(enginesDir, 'libquery_engine.so.node');

if ((!process.env.PRISMA_SCHEMA_ENGINE_BINARY || !fs.existsSync(process.env.PRISMA_SCHEMA_ENGINE_BINARY)) && fs.existsSync(schemaEnginePath)) {
  process.env.PRISMA_SCHEMA_ENGINE_BINARY = schemaEnginePath;
}
if ((!process.env.PRISMA_QUERY_ENGINE_LIBRARY || !fs.existsSync(process.env.PRISMA_QUERY_ENGINE_LIBRARY)) && fs.existsSync(queryEnginePath)) {
  process.env.PRISMA_QUERY_ENGINE_LIBRARY = queryEnginePath;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

prisma
  .$connect()
  .then(() => {
    logger.info('Prisma ORM connected successfully to database');
  })
  .catch((err) => {
    logger.error({ err }, 'Failed to connect to database via Prisma');
  });
