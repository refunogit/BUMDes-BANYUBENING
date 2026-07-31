import { productsRepository } from './products.repository';
import { emitContentUpdate } from '../../shared/socket';
import { logAudit } from '../../shared/logger';

export class ProductsService {
  private formatProduct(product: any) {
    let galleryImages: string[] = [];
    try {
      galleryImages = JSON.parse(product.galleryImages || '[]');
    } catch (err) {
      galleryImages = [product.coverImage];
    }
    return {
      ...product,
      galleryImages,
    };
  }

  async getProducts(category?: string, query?: string) {
    const list = await productsRepository.findAll(category, query);
    return list.map((p) => this.formatProduct(p));
  }

  async getProductBySlug(slug: string) {
    const p = await productsRepository.findBySlug(slug);
    if (!p) throw new Error('Produk tidak ditemukan.');
    return this.formatProduct(p);
  }

  async createProduct(data: any, performedBy = 'ADMIN') {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const created = await productsRepository.create({ ...data, slug });
    logAudit('CREATE_PRODUCT', 'Product', created.id, performedBy, { name: created.name });
    emitContentUpdate('products', created);
    return this.formatProduct(created);
  }

  async updateProduct(id: string, data: any, performedBy = 'ADMIN') {
    if (data.name && !data.slug) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    const updated = await productsRepository.update(id, data);
    logAudit('UPDATE_PRODUCT', 'Product', updated.id, performedBy, { name: updated.name });
    emitContentUpdate('products', updated);
    return this.formatProduct(updated);
  }

  async deleteProduct(id: string, performedBy = 'ADMIN') {
    const deleted = await productsRepository.delete(id);
    logAudit('DELETE_PRODUCT', 'Product', id, performedBy, { name: deleted.name });
    emitContentUpdate('products', { id, deleted: true });
    return this.formatProduct(deleted);
  }
}

export const productsService = new ProductsService();
