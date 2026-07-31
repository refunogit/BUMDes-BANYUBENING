import { prisma } from '../../shared/prisma/client';
import { RunningText } from '@prisma/client';

export class RunningTextRepository {
  async findAll(): Promise<RunningText[]> {
    return prisma.runningText.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async create(data: { text: string; category: string; isActive?: boolean; orderIndex?: number }): Promise<RunningText> {
    return prisma.runningText.create({
      data: {
        text: data.text,
        category: data.category,
        isActive: data.isActive ?? true,
        orderIndex: data.orderIndex ?? 0,
      },
    });
  }

  async update(id: string, data: Partial<RunningText>): Promise<RunningText> {
    return prisma.runningText.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<RunningText> {
    return prisma.runningText.delete({
      where: { id },
    });
  }
}

export const runningTextRepository = new RunningTextRepository();
