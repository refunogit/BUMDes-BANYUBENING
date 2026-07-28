import { prisma } from '../../../config/database';
import { parsePagination, getSkipTake, paginateResult } from '../../../utils/pagination';
import { createAuditLog } from '../../../lib/audit';
import { AppError } from '../../../middlewares/error.middleware';

export const coaService = {
  async list(query: any) {
    const pagination = parsePagination(query);
    const { skip, take } = getSkipTake(pagination);
    const where: any = {};
    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.type) where.type = query.type;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

    const [data, total] = await Promise.all([
      prisma.coa.findMany({
        where,
        skip,
        take,
        orderBy: { code: 'asc' },
        include: { parent: true, children: true },
      }),
      prisma.coa.count({ where }),
    ]);
    return paginateResult(data, total, pagination);
  },

  async tree() {
    const all = await prisma.coa.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } });
    // Build hierarchy
    const map = new Map<string, any>();
    all.forEach(c => map.set(c.id, { ...c, children: [] }));
    const roots: any[] = [];
    all.forEach(c => {
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId).children.push(map.get(c.id));
      } else {
        roots.push(map.get(c.id));
      }
    });
    return roots;
  },

  async getById(id: string) {
    const coa = await prisma.coa.findUnique({ where: { id }, include: { parent: true, children: true } });
    if (!coa) throw new AppError(404, 'CoA not found');
    return coa;
  },

  async create(data: any, userId?: string, ip?: string, userAgent?: string) {
    // Validate code uniqueness
    const exists = await prisma.coa.findUnique({ where: { code: data.code } });
    if (exists) throw new AppError(409, 'CoA code already exists');

    let level = 1;
    if (data.parentId) {
      const parent = await prisma.coa.findUnique({ where: { id: data.parentId } });
      if (!parent) throw new AppError(404, 'Parent CoA not found');
      level = parent.level + 1;
    }

    const normalBalance = data.normalBalance || (['ASSET','EXPENSE'].includes(data.type) ? 'DEBIT' : 'CREDIT');

    const coa = await prisma.coa.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        normalBalance,
        parentId: data.parentId,
        level,
        description: data.description,
        isActive: data.isActive === 'false' ? false : data.isActive === 'true' ? true : data.isActive ?? true,
      },
    });

    await createAuditLog({ userId, action: 'CREATE', entity: 'Coa', entityId: coa.id, newValue: coa, ipAddress: ip, userAgent });
    return coa;
  },

  async update(id: string, data: any, userId?: string, ip?: string, userAgent?: string) {
    const existing = await prisma.coa.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'CoA not found');

    if (data.code && data.code !== existing.code) {
      const dup = await prisma.coa.findUnique({ where: { code: data.code } });
      if (dup) throw new AppError(409, 'CoA code already exists');
    }

    let level = existing.level;
    if (data.parentId && data.parentId !== existing.parentId) {
      const parent = await prisma.coa.findUnique({ where: { id: data.parentId } });
      if (!parent) throw new AppError(404, 'Parent CoA not found');
      if (parent.id === id) throw new AppError(400, 'CoA cannot be parent of itself');
      level = parent.level + 1;
    }

    const updated = await prisma.coa.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        normalBalance: data.normalBalance,
        parentId: data.parentId,
        level,
        description: data.description,
        isActive: data.isActive !== undefined ? (data.isActive === 'false' ? false : data.isActive === 'true' ? true : data.isActive) : undefined,
      },
    });

    await createAuditLog({ userId, action: 'UPDATE', entity: 'Coa', entityId: id, oldValue: existing, newValue: updated, ipAddress: ip, userAgent });
    return updated;
  },

  async delete(id: string, userId?: string, ip?: string, userAgent?: string) {
    const existing = await prisma.coa.findUnique({ where: { id }, include: { children: true, entries: true } });
    if (!existing) throw new AppError(404, 'CoA not found');
    if (existing.children.length > 0) throw new AppError(400, 'Cannot delete CoA with children');
    if (existing.entries.length > 0) throw new AppError(400, 'Cannot delete CoA with journal entries');

    await prisma.coa.delete({ where: { id } });
    await createAuditLog({ userId, action: 'DELETE', entity: 'Coa', entityId: id, oldValue: existing, ipAddress: ip, userAgent });
    return { message: 'CoA deleted' };
  },
};
