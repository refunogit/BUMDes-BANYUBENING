import { prisma } from '../../shared/prisma/client';
import { Article } from '@prisma/client';

export class ArticlesRepository {
  async findAll(category?: string, query?: string): Promise<Article[]> {
    return prisma.article.findMany({
      where: {
        category: category ? { equals: category } : undefined,
        OR: query
          ? [
              { title: { contains: query } },
              { summary: { contains: query } },
              { content: { contains: query } },
            ]
          : undefined,
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findBySlug(slug: string): Promise<Article | null> {
    return prisma.article.findUnique({
      where: { slug },
    });
  }

  async findById(id: string): Promise<Article | null> {
    return prisma.article.findUnique({
      where: { id },
    });
  }

  async create(data: {
    title: string;
    slug: string;
    summary: string;
    content: string;
    coverImage: string;
    category: string;
    author: string;
  }): Promise<Article> {
    return prisma.article.create({
      data: {
        ...data,
        views: 0,
      },
    });
  }

  async update(id: string, data: Partial<Article>): Promise<Article> {
    return prisma.article.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Article> {
    return prisma.article.delete({
      where: { id },
    });
  }
}

export const articlesRepository = new ArticlesRepository();
