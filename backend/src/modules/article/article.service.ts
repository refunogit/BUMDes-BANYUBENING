import { prisma } from '../../config/database';
import { slugify, generateUniqueSlug } from '../../utils/slug';
import { parsePagination, getSkipTake, paginateResult } from '../../utils/pagination';
import { createAuditLog } from '../../lib/audit';
import { AppError } from '../../middlewares/error.middleware';
import { queueService } from '../../config/redis';

export const articleService = {
  async list(query: any) {
    const pagination = parsePagination(query);
    const { skip, take } = getSkipTake(pagination);
    const where: any = {};
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.category) where.category = query.category;
    if (query.isPublished !== undefined) where.isPublished = query.isPublished === 'true';
    // For public, default published true if no auth? Handled in controller public route.
    
    const [data, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take,
        orderBy: { [pagination.sortBy]: pagination.sortOrder } as any as any,
      }),
      prisma.article.count({ where }),
    ]);

    return paginateResult(data, total, pagination);
  },

  async getBySlug(slug: string) {
    const article = await prisma.article.findUnique({ where: { slug } });
    if (!article) throw new AppError(404, 'Article not found');
    // increment views async
    prisma.article.update({ where: { id: article.id }, data: { views: { increment: 1 } } }).catch(()=>{});
    return article;
  },

  async getById(id: string) {
    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) throw new AppError(404, 'Article not found');
    return article;
  },

  async create(data: any, coverImageUrl?: string, userId?: string, ip?: string, userAgent?: string) {
    const slug = data.slug ? slugify(data.slug) : generateUniqueSlug(data.title);
    let tags: string[] = [];
    if (Array.isArray(data.tags)) tags = data.tags;
    else if (typeof data.tags === 'string') {
      try { tags = JSON.parse(data.tags); } catch { tags = data.tags.split(',').map((t:string)=>t.trim()); }
    }

    const article = await prisma.article.create({
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt,
        content: data.content,
        category: data.category,
        tags,
        isPublished: data.isPublished === 'false' ? false : data.isPublished === 'true' ? true : data.isPublished ?? true,
        author: data.author,
        coverImage: coverImageUrl,
        publishedAt: data.isPublished ? new Date() : null,
      },
    });

    await createAuditLog({ userId, action: 'CREATE', entity: 'Article', entityId: article.id, newValue: article, ipAddress: ip, userAgent });

    // invalidate cache
    await queueService.delCache('articles:list');

    return article;
  },

  async update(id: string, data: any, coverImageUrl?: string, userId?: string, ip?: string, userAgent?: string) {
    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Article not found');

    let tags: string[] | undefined;
    if (data.tags) {
      if (Array.isArray(data.tags)) tags = data.tags;
      else if (typeof data.tags === 'string') {
        try { tags = JSON.parse(data.tags); } catch { tags = data.tags.split(',').map((t:string)=>t.trim()); }
      }
    }

    const updated = await prisma.article.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug ? slugify(data.slug) : undefined,
        excerpt: data.excerpt,
        content: data.content,
        category: data.category,
        tags,
        isPublished: data.isPublished !== undefined ? (data.isPublished === 'false' ? false : data.isPublished === 'true' ? true : data.isPublished) : undefined,
        author: data.author,
        coverImage: coverImageUrl || undefined,
      },
    });

    await createAuditLog({ userId, action: 'UPDATE', entity: 'Article', entityId: id, oldValue: existing, newValue: updated, ipAddress: ip, userAgent });

    await queueService.delCache('articles:list');

    return updated;
  },

  async delete(id: string, userId?: string, ip?: string, userAgent?: string) {
    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Article not found');

    await prisma.article.delete({ where: { id } });

    await createAuditLog({ userId, action: 'DELETE', entity: 'Article', entityId: id, oldValue: existing, ipAddress: ip, userAgent });

    await queueService.delCache('articles:list');

    return { message: 'Article deleted' };
  },
};
