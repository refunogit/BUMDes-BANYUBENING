import { prisma } from '../../config/database';
import { parsePagination, getSkipTake, paginateResult } from '../../utils/pagination';
import { createAuditLog } from '../../lib/audit';
import { AppError } from '../../middlewares/error.middleware';
import { queueService } from '../../config/redis';


export const pengurusService = {
  async list(query: any) {
    const pagination = parsePagination(query);
    const { skip, take } = getSkipTake(pagination);
    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { role: { contains: query.search, mode: 'insensitive' } },
        { roleLabel: { contains: query.search, mode: 'insensitive' } },
        { bio: { contains: query.search, mode: 'insensitive' } },
        { order: { contains: query.search, mode: 'insensitive' } },
        { isActive: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    if (query.isPublished !== undefined) where.isPublished = query.isPublished === 'true';

    const [data, total] = await Promise.all([
      prisma.pengurus.findMany({ where, skip, take, orderBy: { [pagination.sortBy]: pagination.sortOrder } as any as any }),
      prisma.pengurus.count({ where }),
    ]);
    return paginateResult(data, total, pagination);
  },

  async getById(id: string) {
    const item = await prisma.pengurus.findUnique({ where: { id } });
    if (!item) throw new AppError(404, 'Pengurus not found');
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


    if (imageUrl) {
      payload.photoUrl = imageUrl;
    }


    const created = await prisma.pengurus.create({ data: payload });

    await createAuditLog({ userId, action: 'CREATE', entity: 'Pengurus', entityId: created.id, newValue: created, ipAddress: ip, userAgent });
    await queueService.delCache('pengurus:list');
    return created;
  },

  async update(id: string, data: any, imageUrl?: string, userId?: string, ip?: string, userAgent?: string) {
    const existing = await prisma.pengurus.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Pengurus not found');

    const payload: any = { ...data };
    if (payload.isActive !== undefined) payload.isActive = payload.isActive === 'true' ? true : payload.isActive === 'false' ? false : payload.isActive;
    if (payload.isPublished !== undefined) payload.isPublished = payload.isPublished === 'true' ? true : payload.isPublished === 'false' ? false : payload.isPublished;
    if (payload.order !== undefined) payload.order = parseInt(payload.order, 10);
    if (payload.progress !== undefined) payload.progress = parseInt(payload.progress, 10);
    if (payload.speed !== undefined) payload.speed = parseInt(payload.speed, 10);
    if (payload.budget !== undefined) payload.budget = isNaN(parseFloat(payload.budget)) ? undefined : parseFloat(payload.budget);


    if (imageUrl) {
      payload.photoUrl = imageUrl;
    }


    const updated = await prisma.pengurus.update({ where: { id }, data: payload });

    await createAuditLog({ userId, action: 'UPDATE', entity: 'Pengurus', entityId: id, oldValue: existing, newValue: updated, ipAddress: ip, userAgent });
    await queueService.delCache('pengurus:list');
    return updated;
  },

  async delete(id: string, userId?: string, ip?: string, userAgent?: string) {
    const existing = await prisma.pengurus.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Pengurus not found');
    await prisma.pengurus.delete({ where: { id } });
    await createAuditLog({ userId, action: 'DELETE', entity: 'Pengurus', entityId: id, oldValue: existing, ipAddress: ip, userAgent });
    await queueService.delCache('pengurus:list');
    return { message: 'Pengurus deleted' };
  },
};
