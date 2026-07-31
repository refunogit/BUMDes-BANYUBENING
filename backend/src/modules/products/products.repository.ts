import { prisma } from '../../shared/prisma/client';
import { Product } from '@prisma/client';

export class ProductsRepository {
  async findAll(category?: string, query?: string) {
    return prisma.product.findMany({
      where: {
        category: category ? { equals: category } : undefined,
        OR: query
          ? [
              { name: { contains: query } },
              { description: { contains: query } },
              { category: { contains: query } },
            ]
          : undefined,
      },
      orderBy: { soldCount: 'desc' },
    });
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { slug },
    });
  }

  async findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { id },
    });
  }

  async create(data: {
    name: string;
    slug: string;
    category: string;
    price: number;
    stock: number;
    description: string;
    coverImage: string;
    galleryImages: string[];
    unitName?: string;
    rating?: number;
    soldCount?: number;
  }): Promise<Product> {
    return prisma.product.create({
      data: {
        ...data,
        galleryImages: JSON.stringify(data.galleryImages || [data.coverImage]),
        unitName: data.unitName || 'pcs',
        rating: data.rating ?? 5.0,
        soldCount: data.soldCount ?? 0,
      },
    });
  }

  async update(id: string, data: any): Promise<Product> {
    const updateData = { ...data };
    if (Array.isArray(data.galleryImages)) {
      updateData.galleryImages = JSON.stringify(data.galleryImages);
    }
    return prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<Product> {
    return prisma.product.delete({
      where: { id },
    });
  }
}

export const productsRepository = new ProductsRepository();
