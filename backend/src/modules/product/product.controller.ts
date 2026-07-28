import { Request, Response, NextFunction } from 'express';
import { productService } from './product.service';
import { successResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { storageProvider } from '../../config/storage';

export const productController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.list(req.query);
      res.json(successResponse(result.data, 'Products fetched', { pagination: result.pagination }));
    } catch (e) { next(e); }
  },

  async publicList(req: Request, res: Response, next: NextFunction) {
    try {
      const query = { ...req.query, isActive: 'true' };
      const result = await productService.list(query);
      res.json(successResponse(result.data, 'Products fetched', { pagination: result.pagination }));
    } catch (e) { next(e); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await productService.getById(req.params.id);
      res.json(successResponse(item));
    } catch (e) { next(e); }
  },

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await productService.getBySlug(req.params.slug);
      res.json(successResponse(item));
    } catch (e) { next(e); }
  },

  async categories(req: Request, res: Response, next: NextFunction) {
    try {
      const cats = await productService.getCategories();
      res.json(successResponse(cats));
    } catch (e) { next(e); }
  },

  async featured(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await productService.featured();
      res.json(successResponse(items));
    } catch (e) { next(e); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const files = (req as any).files as Express.Multer.File[] | undefined;
      const imageUrls: string[] = [];
      if (files && files.length) {
        for (const file of files) {
          const url = await storageProvider.save(file, 'products');
          imageUrls.push(url);
        }
      }
      const product = await productService.create(req.body, imageUrls, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('product:created', product);
      res.status(201).json(successResponse(product, 'Product created'));
    } catch (e) { next(e); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const files = (req as any).files as Express.Multer.File[] | undefined;
      const imageUrls: string[] = [];
      if (files && files.length) {
        for (const file of files) {
          const url = await storageProvider.save(file, 'products');
          imageUrls.push(url);
        }
      }
      const product = await productService.update(req.params.id, req.body, imageUrls, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('product:updated', product);
      res.json(successResponse(product, 'Product updated'));
    } catch (e) { next(e); }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await productService.delete(req.params.id, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('product:deleted', { id: req.params.id });
      res.json(successResponse(result));
    } catch (e) { next(e); }
  },
};
