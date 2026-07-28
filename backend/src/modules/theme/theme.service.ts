import { prisma } from '../../config/database';
import { parsePagination, getSkipTake, paginateResult } from '../../utils/pagination';
import { createAuditLog } from '../../lib/audit';
import { AppError } from '../../middlewares/error.middleware';
import { queueService } from '../../config/redis';


export const themeConfigService = {
  async list(query: any) {
    const pagination = parsePagination(query);
    const { skip, take } = getSkipTake(pagination);
    const where: any = {};
    if (query.search) {
      where.OR = [
        { type: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { isActive: { contains: query.search, mode: 'insensitive' } },
        { primaryColor: { contains: query.search, mode: 'insensitive' } },
        { secondaryColor: { contains: query.search, mode: 'insensitive' } },
        { accentColor: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    if (query.isPublished !== undefined) where.isPublished = query.isPublished === 'true';

    const [data, total] = await Promise.all([
      prisma.themeConfig.findMany({ where, skip, take, orderBy: { [pagination.sortBy]: pagination.sortOrder } as any as any }),
      prisma.themeConfig.count({ where }),
    ]);
    return paginateResult(data, total, pagination);
  },

  async getById(id: string) {
    const item = await prisma.themeConfig.findUnique({ where: { id } });
    if (!item) throw new AppError(404, 'ThemeConfig not found');
    return item;
  },


  async create(data: any,  userId?: string, ip?: string, userAgent?: string) {
    const payload: any = { ...data };
    // Normalize booleans and numbers
    if (payload.isActive !== undefined) payload.isActive = payload.isActive === 'true' ? true : payload.isActive === 'false' ? false : payload.isActive;
    if (payload.isPublished !== undefined) payload.isPublished = payload.isPublished === 'true' ? true : payload.isPublished === 'false' ? false : payload.isPublished;
    if (payload.order !== undefined) payload.order = parseInt(payload.order, 10);
    if (payload.progress !== undefined) payload.progress = parseInt(payload.progress, 10);
    if (payload.speed !== undefined) payload.speed = parseInt(payload.speed, 10);
    if (payload.budget !== undefined) payload.budget = isNaN(parseFloat(payload.budget)) ? undefined : parseFloat(payload.budget);



    const created = await prisma.themeConfig.create({ data: payload });

    await createAuditLog({ userId, action: 'CREATE', entity: 'ThemeConfig', entityId: created.id, newValue: created, ipAddress: ip, userAgent });
    await queueService.delCache('themeConfig:list');
    return created;
  },

  async update(id: string, data: any,  userId?: string, ip?: string, userAgent?: string) {
    const existing = await prisma.themeConfig.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'ThemeConfig not found');

    const payload: any = { ...data };
    if (payload.isActive !== undefined) payload.isActive = payload.isActive === 'true' ? true : payload.isActive === 'false' ? false : payload.isActive;
    if (payload.isPublished !== undefined) payload.isPublished = payload.isPublished === 'true' ? true : payload.isPublished === 'false' ? false : payload.isPublished;
    if (payload.order !== undefined) payload.order = parseInt(payload.order, 10);
    if (payload.progress !== undefined) payload.progress = parseInt(payload.progress, 10);
    if (payload.speed !== undefined) payload.speed = parseInt(payload.speed, 10);
    if (payload.budget !== undefined) payload.budget = isNaN(parseFloat(payload.budget)) ? undefined : parseFloat(payload.budget);



    const updated = await prisma.themeConfig.update({ where: { id }, data: payload });

    await createAuditLog({ userId, action: 'UPDATE', entity: 'ThemeConfig', entityId: id, oldValue: existing, newValue: updated, ipAddress: ip, userAgent });
    await queueService.delCache('themeConfig:list');
    return updated;
  },

  async delete(id: string, userId?: string, ip?: string, userAgent?: string) {
    const existing = await prisma.themeConfig.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'ThemeConfig not found');
    await prisma.themeConfig.delete({ where: { id } });
    await createAuditLog({ userId, action: 'DELETE', entity: 'ThemeConfig', entityId: id, oldValue: existing, ipAddress: ip, userAgent });
    await queueService.delCache('themeConfig:list');
    return { message: 'ThemeConfig deleted' };
  },
};
