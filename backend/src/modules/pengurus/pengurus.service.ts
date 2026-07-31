import { pengurusRepository } from './pengurus.repository';
import { emitContentUpdate } from '../../shared/socket';
import { logAudit } from '../../shared/logger';

export class PengurusService {
  async getPengurusList() {
    return pengurusRepository.findAll();
  }

  async createPengurus(data: any, performedBy = 'ADMIN') {
    const created = await pengurusRepository.create(data);
    logAudit('CREATE_PENGURUS', 'Pengurus', created.id, performedBy, { name: created.name, role: created.role });
    emitContentUpdate('pengurus', created);
    return created;
  }

  async updatePengurus(id: string, data: any, performedBy = 'ADMIN') {
    const updated = await pengurusRepository.update(id, data);
    logAudit('UPDATE_PENGURUS', 'Pengurus', updated.id, performedBy, { name: updated.name, role: updated.role });
    emitContentUpdate('pengurus', updated);
    return updated;
  }

  async deletePengurus(id: string, performedBy = 'ADMIN') {
    const deleted = await pengurusRepository.delete(id);
    logAudit('DELETE_PENGURUS', 'Pengurus', id, performedBy, { name: deleted.name });
    emitContentUpdate('pengurus', { id, deleted: true });
    return deleted;
  }
}

export const pengurusService = new PengurusService();
