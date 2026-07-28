import { prisma } from '../../config/database';
import { parsePagination, getSkipTake, paginateResult } from '../../utils/pagination';
import { createAuditLog } from '../../lib/audit';
import { AppError } from '../../middlewares/error.middleware';
import { queueService } from '../../config/redis';
import { slugify, generateUniqueSlug } from '../../utils/slug';

export const portfolioService = {
  async list(query: any) {
    const pagination = parsePagination(query);
    const { skip, take } = getSkipTake(pagination);
    const where: any = {};
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } },
        { clientName: { contains: query.search, mode: 'insensitive' } },
        { linkUrl: { contains: query.search, mode: 'insensitive' } },
        { isPublished: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    if (query.isPublished !== undefined) where.isPublished = query.isPublished === 'true';

    const [data, total] = await Promise.all([
      prisma.portfolio.findMany({ where, skip, take, orderBy: { [pagination.sortBy]: pagination.sortOrder } as any as any }),
      prisma.portfolio.count({ where }),
    ]);
    return paginateResult(data, total, pagination);
  },

  async getById(id: string) {
    const item = await prisma.portfolio.findUnique({ where: { id } });
    if (!item) throw new AppError(404, 'Portfolio not found');
    return item;
  },

  async getBySlug(slug: string) {
    const item = await prisma.portfolio.findUnique({ where: { slug } });
    if (!item) throw new AppError(404, 'Portfolio not found');
    return item;
  },


  async create(data: any, imageUrl?: string, userId?: string, ip?: string, userAgent?: string) {
    const payload: any = { ...data };
    // Normalize booleans and numbers
    if (payload.isActive !== undefined) payload.isActive = payload.isActive === 'true' ? true : payload.isActive === 'false' ? false : payload.isActive;
    if (payload.isPublished !== undefined) payload.isPublished = payload.isPublished === 'true' ? true : payload.isPublished === 'false' ? false : payload.isPublished;
    if (payload.order !== undefined) payload.order = parseInt(payload.order, 10);
    if (payload.progress !== undefined) payload.progress = parseInt(payload.progress, 10);
    if (payload.speed !== undefined) payload.speed = parseInt(payload.speed, 10);
    if (payload.budget !== undefined) payload.budget = isNaN(parseFloat(payload.budget)) ? undefined : parseFloat(payload.budget);

    const slug = data.slug ? slugify(data.slug) : generateUniqueSlug(data.title);
    payload.slug = slug;


    if (imageUrl) {
      payload.coverImage = imageUrl;
    }


    const created = await prisma.portfolio.create({ data: payload });

    await createAuditLog({ userId, action: 'CREATE', entity: 'Portfolio', entityId: created.id, newValue: created, ipAddress: ip, userAgent });
    await queueService.delCache('portfolio:list');
    return created;
  },

  async update(id: string, data: any, imageUrl?: string, userId?: string, ip?: string, userAgent?: string) {
    const existing = await prisma.portfolio.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Portfolio not found');

    const payload: any = { ...data };
    if (payload.isActive !== undefined) payload.isActive = payload.isActive === 'true' ? true : payload.isActive === 'false' ? false : payload.isActive;
    if (payload.isPublished !== undefined) payload.isPublished = payload.isPublished === 'true' ? true : payload.isPublished === 'false' ? false : payload.isPublished;
    if (payload.order !== undefined) payload.order = parseInt(payload.order, 10);
    if (payload.progress !== undefined) payload.progress = parseInt(payload.progress, 10);
    if (payload.speed !== undefined) payload.speed = parseInt(payload.speed, 10);
    if (payload.budget !== undefined) payload.budget = isNaN(parseFloat(payload.budget)) ? undefined : parseFloat(payload.budget);

    if (payload.slug) payload.slug = slugify(payload.slug);


    if (imageUrl) {
      payload.coverImage = imageUrl;
    }


    const updated = await prisma.portfolio.update({ where: { id }, data: payload });

    await createAuditLog({ userId, action: 'UPDATE', entity: 'Portfolio', entityId: id, oldValue: existing, newValue: updated, ipAddress: ip, userAgent });
    await queueService.delCache('portfolio:list');
    return updated;
  },

  async delete(id: string, userId?: string, ip?: string, userAgent?: string) {
    const existing = await prisma.portfolio.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Portfolio not found');
    await prisma.portfolio.delete({ where: { id } });
    await createAuditLog({ userId, action: 'DELETE', entity: 'Portfolio', entityId: id, oldValue: existing, ipAddress: ip, userAgent });
    await queueService.delCache('portfolio:list');
    return { message: 'Portfolio deleted' };
  },
};
