import { prisma } from '../../config/database';

export const searchService = {
  async search(query: string, filters?: any) {
    if (!query || query.trim().length < 2) {
      return { articles: [], products: [], programKerja: [], total: 0 };
    }

    const search = query.trim();

    const [articles, products, programKerja] = await Promise.all([
      prisma.article.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
            { excerpt: { contains: search, mode: 'insensitive' } },
          ],
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, category: true, createdAt: true },
      }),
      prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { shortDesc: { contains: search, mode: 'insensitive' } },
          ],
        },
        take: 10,
        orderBy: { soldCount: 'desc' },
        include: { images: { take: 1 } },
      }),
      prisma.programKerja.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, slug: true, description: true, category: true, status: true, createdAt: true },
      }),
    ]);

    return {
      articles,
      products,
      programKerja,
      total: articles.length + products.length + programKerja.length,
      query: search,
    };
  },

  async suggestions(query: string) {
    if (!query || query.length < 2) return [];

    const search = query.trim();

    const [articleTitles, productNames, programTitles] = await Promise.all([
      prisma.article.findMany({
        where: { title: { contains: search, mode: 'insensitive' } },
        select: { title: true },
        take: 5,
      }),
      prisma.product.findMany({
        where: { name: { contains: search, mode: 'insensitive' } },
        select: { name: true },
        take: 5,
      }),
      prisma.programKerja.findMany({
        where: { title: { contains: search, mode: 'insensitive' } },
        select: { title: true },
        take: 5,
      }),
    ]);

    const suggestions = [
      ...articleTitles.map(a => a.title),
      ...productNames.map(p => p.name),
      ...programTitles.map(pr => pr.title),
    ];

    return [...new Set(suggestions)].slice(0, 10);
  },
};
