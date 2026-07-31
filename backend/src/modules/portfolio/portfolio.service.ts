import { portfolioRepository } from './portfolio.repository';
import { emitContentUpdate } from '../../shared/socket';
import { logAudit } from '../../shared/logger';

export class PortfolioService {
  async getPortfolios() {
    return portfolioRepository.findAll();
  }

  async createPortfolio(data: any, performedBy = 'ADMIN') {
    const created = await portfolioRepository.create(data);
    logAudit('CREATE_PORTFOLIO', 'Portfolio', created.id, performedBy, { title: created.title });
    emitContentUpdate('portfolio', created);
    return created;
  }

  async updatePortfolio(id: string, data: any, performedBy = 'ADMIN') {
    const updated = await portfolioRepository.update(id, data);
    logAudit('UPDATE_PORTFOLIO', 'Portfolio', updated.id, performedBy, { title: updated.title });
    emitContentUpdate('portfolio', updated);
    return updated;
  }

  async deletePortfolio(id: string, performedBy = 'ADMIN') {
    const deleted = await portfolioRepository.delete(id);
    logAudit('DELETE_PORTFOLIO', 'Portfolio', id, performedBy, { title: deleted.title });
    emitContentUpdate('portfolio', { id, deleted: true });
    return deleted;
  }
}

export const portfolioService = new PortfolioService();
