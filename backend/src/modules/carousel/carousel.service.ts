import { prisma } from '../../config/database';
import { parsePagination, getSkipTake, paginateResult } from '../../utils/pagination';
import { createAuditLog } from '../../lib/audit';
import { AppError } from '../../middlewares/error.middleware';

export const carouselService = {
  async list(query: any) {
    const pagination = parsePagination(query);
    const { skip, take } = getSkipTake(pagination);
    const where: any = {};
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

    const [data, total] = await Promise.all([
      prisma.carouselItem.findMany({ where, skip, take, orderBy: { order: 'asc' } }),
      prisma.carouselItem.count({ where }),
    ]);
    return paginateResult(data, total, pagination);
  },

  async getActive() {
    return prisma.carouselItem.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
  },

  async getById(id: string) {
    const item = await prisma.carouselItem.findUnique({ where: { id } });
    if (!item) throw new AppError(404, 'Carousel item not found');
    return item;
  },

  async create(data: any, imageUrl: string, userId?: string, ip?: string, userAgent?: string) {
    if (!imageUrl) throw new AppError(400, 'Image required');
    const payload: any = {
      title: data.title,
      imageUrl,
      linkUrl: data.linkUrl,
      order: data.order ? parseInt(data.order, 10) : 0,
      isActive: data.isActive === 'false' ? false : data.isActive === 'true' ? true : data.isActive ?? true,
    };

    const created = await prisma.carouselItem.create({ data: payload });
    await createAuditLog({ userId, action: 'CREATE', entity: 'CarouselItem', entityId: created.id, newValue: created, ipAddress: ip, userAgent });
    return created;
  },

  async update(id: string, data: any, imageUrl?: string, userId?: string, ip?: string, userAgent?: string) {
    const existing = await prisma.carouselItem.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Carousel item not found');

    const payload: any = {};
    if (data.title !== undefined) payload.title = data.title;
    if (data.linkUrl !== undefined) payload.linkUrl = data.linkUrl;
    if (data.order !== undefined) payload.order = parseInt(data.order, 10);
    if (data.isActive !== undefined) payload.isActive = data.isActive === 'false' ? false : data.isActive === 'true' ? true : data.isActive;
    if (imageUrl) payload.imageUrl = imageUrl;

    const updated = await prisma.carouselItem.update({ where: { id }, data: payload });
    await createAuditLog({ userId, action: 'UPDATE', entity: 'CarouselItem', entityId: id, oldValue: existing, newValue: updated, ipAddress: ip, userAgent });
    return updated;
  },

  async delete(id: string, userId?: string, ip?: string, userAgent?: string) {
    const existing = await prisma.carouselItem.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Carousel item not found');
    await prisma.carouselItem.delete({ where: { id } });
    await createAuditLog({ userId, action: 'DELETE', entity: 'CarouselItem', entityId: id, oldValue: existing, ipAddress: ip, userAgent });
    return { message: 'Carousel item deleted' };
  },
};
