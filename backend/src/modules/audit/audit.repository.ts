import { prisma } from '../../shared/prisma/client';
import { AuditLog } from '@prisma/client';

export class AuditRepository {
  async findAll(limit = 100): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async findByEntity(entity: string): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: { entity },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
  }
}

export const auditRepository = new AuditRepository();
