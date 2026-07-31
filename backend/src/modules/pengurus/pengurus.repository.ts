import { prisma } from '../../shared/prisma/client';
import { Pengurus } from '@prisma/client';

export class PengurusRepository {
  async findAll(): Promise<Pengurus[]> {
    return prisma.pengurus.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async findById(id: string): Promise<Pengurus | null> {
    return prisma.pengurus.findUnique({
      where: { id },
    });
  }

  async create(data: { name: string; role: string; photoUrl: string; bio?: string; orderIndex?: number; isActive?: boolean }): Promise<Pengurus> {
    return prisma.pengurus.create({
      data: {
        name: data.name,
        role: data.role,
        photoUrl: data.photoUrl,
        bio: data.bio || null,
        orderIndex: data.orderIndex ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: Partial<Pengurus>): Promise<Pengurus> {
    return prisma.pengurus.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Pengurus> {
    return prisma.pengurus.delete({
      where: { id },
    });
  }
}

export const pengurusRepository = new PengurusRepository();
