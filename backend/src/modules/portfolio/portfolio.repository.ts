import { prisma } from '../../shared/prisma/client';
import { Portfolio } from '@prisma/client';

export class PortfolioRepository {
  async findAll(): Promise<Portfolio[]> {
    return prisma.portfolio.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: { title: string; category: string; description: string; imageUrl: string; date: string }): Promise<Portfolio> {
    return prisma.portfolio.create({
      data,
    });
  }

  async update(id: string, data: Partial<Portfolio>): Promise<Portfolio> {
    return prisma.portfolio.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Portfolio> {
    return prisma.portfolio.delete({
      where: { id },
    });
  }
}

export const portfolioRepository = new PortfolioRepository();
