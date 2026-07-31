import { prisma } from '../../shared/prisma/client';
import { UnitUsaha } from '@prisma/client';

export class UnitUsahaRepository {
  async findAll(): Promise<UnitUsaha[]> {
    return prisma.unitUsaha.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findBySlug(slug: string): Promise<UnitUsaha | null> {
    return prisma.unitUsaha.findUnique({
      where: { slug },
    });
  }

  async create(data: {
    name: string;
    slug: string;
    description: string;
    coverImage: string;
    manager: string;
    contact: string;
    contentBlocks: any[];
  }): Promise<UnitUsaha> {
    return prisma.unitUsaha.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        coverImage: data.coverImage,
        manager: data.manager,
        contact: data.contact,
        contentBlocks: JSON.stringify(data.contentBlocks || []),
      },
    });
  }

  async update(id: string, data: any): Promise<UnitUsaha> {
    const updateData = { ...data };
    if (Array.isArray(data.contentBlocks)) {
      updateData.contentBlocks = JSON.stringify(data.contentBlocks);
    }
    return prisma.unitUsaha.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<UnitUsaha> {
    return prisma.unitUsaha.delete({
      where: { id },
    });
  }
}

export const unitUsahaRepository = new UnitUsahaRepository();
