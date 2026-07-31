import { Request, Response } from 'express';
import { productsService } from './products.service';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

export class ProductsController {
  async getProducts(req: Request, res: Response) {
    try {
      const { category, q } = req.query;
      const products = await productsService.getProducts(category as string, q as string);
      return res.status(200).json({ success: true, data: products });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getBySlug(req: Request, res: Response) {
    try {
      const slug = String(req.params.slug);
      const product = await productsService.getProductBySlug(slug);
      return res.status(200).json({ success: true, data: product });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const performedBy = req.user?.email || 'ADMIN';
      const created = await productsService.createProduct(req.body, performedBy);
      return res.status(201).json({ success: true, data: created, message: 'Produk berhasil ditambahkan.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const performedBy = req.user?.email || 'ADMIN';
      const updated = await productsService.updateProduct(id, req.body, performedBy);
      return res.status(200).json({ success: true, data: updated, message: 'Produk berhasil diperbarui.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const performedBy = req.user?.email || 'ADMIN';
      await productsService.deleteProduct(id, performedBy);
      return res.status(200).json({ success: true, message: 'Produk berhasil dihapus.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

export const productsController = new ProductsController();
