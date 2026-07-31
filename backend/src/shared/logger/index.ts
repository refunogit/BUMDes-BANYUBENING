import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export const logAudit = (action: string, entity: string, entityId: string | null, performedBy: string, details: any) => {
  logger.info({
    type: 'AUDIT_LOG',
    action,
    entity,
    entityId,
    performedBy,
    details,
    timestamp: new Date().toISOString(),
  }, `AUDIT: [${action}] on ${entity} (${entityId || 'N/A'}) by ${performedBy}`);
};
