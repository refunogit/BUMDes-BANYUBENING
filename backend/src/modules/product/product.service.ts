import { prisma } from '../../config/database';
import { parsePagination, getSkipTake, paginateResult } from '../../utils/pagination';
import { slugify, generateUniqueSlug } from '../../utils/slug';
import { createAuditLog } from '../../lib/audit';
import { AppError } from '../../middlewares/error.middleware';
import { queueService } from '../../config/redis';

export const productService = {
  async list(query: any) {
    const pagination = parsePagination(query);
    const { skip, take } = getSkipTake(pagination);

    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.category) where.category = query.category;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    if (query.isFeatured !== undefined) where.isFeatured = query.isFeatured === 'true';
    if (query.minPrice) where.price = { ...where.price, gte: parseFloat(query.minPrice) };
    if (query.maxPrice) where.price = { ...where.price, lte: parseFloat(query.maxPrice) };

    // Advanced sorting: popular, latest, price low/high
    let orderBy: any = { [pagination.sortBy]: pagination.sortOrder };
    if (query.sortBy === 'popular') orderBy = { soldCount: 'desc' };
    if (query.sortBy === 'price_low') orderBy = { price: 'asc' };
    if (query.sortBy === 'price_high') orderBy = { price: 'desc' };
    if (query.sortBy === 'rating') orderBy = { rating: 'desc' };

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { images: { orderBy: { order: 'asc' } } },
      }),
      prisma.product.count({ where }),
    ]);

    return paginateResult(data, total, pagination);
  },

  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { order: 'asc' } } },
    });
    if (!product) throw new AppError(404, 'Product not found');
    // increment views
    prisma.product.update({ where: { id }, data: { views: { increment: 1 } } }).catch(()=>{});
    return product;
  },

  async getBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { images: { orderBy: { order: 'asc' } } },
    });
    if (!product) throw new AppError(404, 'Product not found');
    prisma.product.update({ where: { id: product.id }, data: { views: { increment: 1 } } }).catch(()=>{});
    return product;
  },

  async create(data: any, imageUrls: string[], userId?: string, ip?: string, userAgent?: string) {
    const slug = data.slug ? slugify(data.slug) : generateUniqueSlug(data.name);

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        shortDesc: data.shortDesc,
        price: parseFloat(data.price),
        discountPrice: data.discountPrice ? parseFloat(data.discountPrice) : null,
        stock: data.stock ? parseInt(data.stock, 10) : 0,
        sku: data.sku || `SKU-${Date.now()}`,
        category: data.category || 'Umum',
        weight: data.weight ? parseFloat(data.weight) : null,
        isActive: data.isActive === 'false' ? false : data.isActive === 'true' ? true : data.isActive ?? true,
        isFeatured: data.isFeatured === 'true' ? true : data.isFeatured === 'false' ? false : data.isFeatured ?? false,
        images: {
          create: imageUrls.map((url, idx) => ({
            url,
            isPrimary: idx === 0,
            order: idx,
          })),
        },
      },
      include: { images: true },
    });

    await createAuditLog({ userId, action: 'CREATE', entity: 'Product', entityId: product.id, newValue: product, ipAddress: ip, userAgent });
    await queueService.delCache('product:list');
    return product;
  },

  async update(id: string, data: any, imageUrls: string[] = [], userId?: string, ip?: string, userAgent?: string) {
    const existing = await prisma.product.findUnique({ where: { id }, include: { images: true } });
    if (!existing) throw new AppError(404, 'Product not found');

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.slug) updateData.slug = slugify(data.slug);
    if (data.description) updateData.description = data.description;
    if (data.shortDesc !== undefined) updateData.shortDesc = data.shortDesc;
    if (data.price !== undefined) updateData.price = parseFloat(data.price);
    if (data.discountPrice !== undefined) updateData.discountPrice = data.discountPrice ? parseFloat(data.discountPrice) : null;
    if (data.stock !== undefined) updateData.stock = parseInt(data.stock, 10);
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.weight !== undefined) updateData.weight = data.weight ? parseFloat(data.weight) : null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive === 'false' ? false : data.isActive === 'true' ? true : data.isActive;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured === 'true' ? true : data.isFeatured === 'false' ? false : data.isFeatured;

    // Transaction safe update with image handling
    const updated = await prisma.$transaction(async (tx) => {
      if (imageUrls.length > 0 && data.replaceImages === 'true') {
        await tx.productImage.deleteMany({ where: { productId: id } });
      }

      const prod = await tx.product.update({
        where: { id },
        data: {
          ...updateData,
          ...(imageUrls.length > 0
            ? {
                images: {
                  create: imageUrls.map((url, idx) => ({
                    url,
                    isPrimary: existing.images.length === 0 && idx === 0,
                    order: existing.images.length + idx,
                  })),
                },
              }
            : {}),
        },
        include: { images: { orderBy: { order: 'asc' } } },
      });

      return prod;
    });

    await createAuditLog({ userId, action: 'UPDATE', entity: 'Product', entityId: id, oldValue: existing, newValue: updated, ipAddress: ip, userAgent });
    await queueService.delCache('product:list');

    return updated;
  },

  async delete(id: string, userId?: string, ip?: string, userAgent?: string) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Product not found');
    await prisma.product.delete({ where: { id } });
    await createAuditLog({ userId, action: 'DELETE', entity: 'Product', entityId: id, oldValue: existing, ipAddress: ip, userAgent });
    await queueService.delCache('product:list');
    return { message: 'Product deleted' };
  },

  async getCategories() {
    const categories = await prisma.product.groupBy({
      by: ['category'],
      _count: true,
    });
    return categories.map(c => ({ category: c.category, count: c._count }));
  },

  async featured() {
    return prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: 20,
      orderBy: { soldCount: 'desc' },
      include: { images: { orderBy: { order: 'asc' } } },
    });
  },
};
