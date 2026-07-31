import { Router, Request, Response } from 'express';
import { articlesRepository } from '../articles/articles.repository';
import { productsRepository } from '../products/products.repository';
import { prisma } from '../../shared/prisma/client';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const query = String(req.query.q || '').trim();
  try {
    if (!query) {
      return res.status(200).json({
        success: true,
        data: {
          articles: [],
          products: [],
          programKerja: [],
        },
      });
    }

    const [articles, products, programs] = await Promise.all([
      articlesRepository.findAll(undefined, query),
      productsRepository.findAll(undefined, query),
      prisma.programKerja.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { teamName: { contains: query } },
          ],
        },
        include: { blocks: true },
        take: 20,
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        articles,
        products,
        programKerja: programs,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export const searchRouter = router;
