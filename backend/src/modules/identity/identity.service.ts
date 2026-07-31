import { identityRepository } from './identity.repository';
import { emitContentUpdate } from '../../shared/socket';
import { logAudit } from '../../shared/logger';

export class IdentityService {
  async getIdentity() {
    let identity = await identityRepository.getIdentity();
    if (!identity) {
      identity = await identityRepository.upsertIdentity({});
    }
    return identity;
  }

  async updateIdentity(data: any, performedBy = 'ADMIN') {
    const updated = await identityRepository.upsertIdentity(data);
    logAudit('UPDATE_IDENTITY', 'Identity', updated.id, performedBy, data);
    emitContentUpdate('identity', updated);
    return updated;
  }
}

export const identityService = new IdentityService();
