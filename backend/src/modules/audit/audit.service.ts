import { prisma } from '../../config/database';
import { parsePagination, getSkipTake, paginateResult } from '../../utils/pagination';

export const auditService = {
  async list(query: any) {
    const pagination = parsePagination(query);
    const { skip, take } = getSkipTake(pagination);

    const where: any = {};
    if (query.entity) where.entity = query.entity;
    if (query.action) where.action = query.action;
    if (query.userId) where.userId = query.userId;

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { [pagination.sortBy]: pagination.sortOrder } as any as any,
        include: { user: { select: { username: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return paginateResult(data, total, pagination);
  },
};
