import { unitUsahaRepository } from './unit-usaha.repository';
import { emitContentUpdate } from '../../shared/socket';
import { logAudit } from '../../shared/logger';

export class UnitUsahaService {
  private format(item: any) {
    let contentBlocks: any[] = [];
    try {
      contentBlocks = JSON.parse(item.contentBlocks || '[]');
    } catch (e) {
      contentBlocks = [];
    }
    return {
      ...item,
      contentBlocks,
    };
  }

  async getUnitUsahaList() {
    const list = await unitUsahaRepository.findAll();
    return list.map((u) => this.format(u));
  }

  async getBySlug(slug: string) {
    const u = await unitUsahaRepository.findBySlug(slug);
    if (!u) throw new Error('Unit usaha tidak ditemukan.');
    return this.format(u);
  }

  async createUnitUsaha(data: any, performedBy = 'ADMIN') {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const created = await unitUsahaRepository.create({ ...data, slug });
    logAudit('CREATE_UNIT_USAHA', 'UnitUsaha', created.id, performedBy, { name: created.name });
    emitContentUpdate('unit-usaha', created);
    return this.format(created);
  }

  async updateUnitUsaha(id: string, data: any, performedBy = 'ADMIN') {
    if (data.name && !data.slug) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    const updated = await unitUsahaRepository.update(id, data);
    logAudit('UPDATE_UNIT_USAHA', 'UnitUsaha', updated.id, performedBy, { name: updated.name });
    emitContentUpdate('unit-usaha', updated);
    return this.format(updated);
  }

  async deleteUnitUsaha(id: string, performedBy = 'ADMIN') {
    const deleted = await unitUsahaRepository.delete(id);
    logAudit('DELETE_UNIT_USAHA', 'UnitUsaha', id, performedBy, { name: deleted.name });
    emitContentUpdate('unit-usaha', { id, deleted: true });
    return this.format(deleted);
  }
}

export const unitUsahaService = new UnitUsahaService();
