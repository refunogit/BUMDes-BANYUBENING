import { articlesRepository } from './articles.repository';
import { emitContentUpdate } from '../../shared/socket';
import { logAudit } from '../../shared/logger';

export class ArticlesService {
  async getArticles(category?: string, query?: string) {
    return articlesRepository.findAll(category, query);
  }

  async getArticleBySlug(slug: string) {
    const art = await articlesRepository.findBySlug(slug);
    if (!art) throw new Error('Artikel tidak ditemukan.');
    return art;
  }

  async createArticle(data: any, performedBy = 'ADMIN') {
    const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const created = await articlesRepository.create({ ...data, slug });
    logAudit('CREATE_ARTICLE', 'Article', created.id, performedBy, { title: created.title });
    emitContentUpdate('articles', created);
    return created;
  }

  async updateArticle(id: string, data: any, performedBy = 'ADMIN') {
    if (data.title && !data.slug) {
      data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    const updated = await articlesRepository.update(id, data);
    logAudit('UPDATE_ARTICLE', 'Article', updated.id, performedBy, { title: updated.title });
    emitContentUpdate('articles', updated);
    return updated;
  }

  async deleteArticle(id: string, performedBy = 'ADMIN') {
    const deleted = await articlesRepository.delete(id);
    logAudit('DELETE_ARTICLE', 'Article', id, performedBy, { title: deleted.title });
    emitContentUpdate('articles', { id, deleted: true });
    return deleted;
  }
}

export const articlesService = new ArticlesService();
