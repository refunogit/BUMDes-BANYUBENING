import { prisma } from '../config/database';

export async function createAuditLog(params: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldValue: params.oldValue || undefined,
        newValue: params.newValue || undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    // Audit log failing should not break main operation, but log it
    console.error('Audit log failed', error);
  }
}
