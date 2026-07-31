import { auditRepository } from './audit.repository';

export class AuditService {
  async getAuditLogs(entity?: string) {
    if (entity) {
      return auditRepository.findByEntity(entity);
    }
    return auditRepository.findAll();
  }
}

export const auditService = new AuditService();
