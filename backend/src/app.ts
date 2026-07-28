import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import path from 'path';
import { env } from './config/env';
import { logger, httpLogger } from './config/pino';
import { globalRateLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import xss from 'xss';

// Routes
import authRoutes from './modules/auth/auth.route';
import identityRoutes from './modules/identity/identity.route';
import articleRoutes from './modules/article/article.route';
import programKerjaRoutes from './modules/programKerja/programKerja.route';
import runningTextRoutes from './modules/runningText/runningText.route';
import pengurusRoutes from './modules/pengurus/pengurus.route';
import productRoutes from './modules/product/product.route';
import portfolioRoutes from './modules/portfolio/portfolio.route';
import carouselRoutes from './modules/carousel/carousel.route';
import themeRoutes from './modules/theme/theme.route';
import coaRoutes from './modules/finance/coa/coa.route';
import journalRoutes from './modules/finance/journal/journal.route';
import ledgerRoutes from './modules/finance/ledger/ledger.route';
import reportRoutes from './modules/finance/report/report.route';
import whatsappRoutes from './modules/whatsapp/whatsapp.route';
import notificationRoutes from './modules/notification/notification.route';
import searchRoutes from './modules/search/search.route';
import storageRoutes from './modules/storage/storage.route';
import auditRoutes from './modules/audit/audit.route';
import backupRoutes from './modules/backup/backup.route';

const app = express();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: (origin, callback) => {
    const allowed = env.CORS_ORIGIN.split(',').map(o => o.trim());
    if (!origin || allowed.includes('*') || allowed.includes(origin) || env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      // Allow all in dev for flexibility
      callback(null, true);
    }
  },
  credentials: true,
}));

app.use(globalRateLimiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// XSS sanitization middleware - custom simple
app.use((req, _res, next) => {
  const sanitize = (obj: any): any => {
    if (!obj) return obj;
    if (typeof obj === 'string') return xss(obj);
    if (Array.isArray(obj)) return obj.map(sanitize);
    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  // Note: query sanitization done carefully to not break zod
  next();
});

// Logging
app.use(pinoHttp(httpLogger as any));

// Static uploads
const uploadPath = path.resolve(env.UPLOAD_DIR);
app.use('/uploads', express.static(uploadPath, {
  maxAge: '1d',
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));

// Health check - monitoring & devops
app.get('/health', async (_req, res) => {
  const start = Date.now();
  
  let dbStatus = 'unknown';
  try {
    const { prisma } = await import('./config/database');
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }

  const { isRedisReady } = await import('./config/redis');
  const redisStatus = isRedisReady() ? 'connected' : 'fallback';

  res.json({
    success: true,
    message: 'BUMDes BANYUBENING API is healthy',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${Date.now() - start}ms`,
      database: dbStatus,
      redis: redisStatus,
      version: '1.0.0',
      environment: env.NODE_ENV,
      memory: process.memoryUsage(),
    },
  });
});

// Root
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: '🌊 BUMDes BANYUBENING Enterprise API',
    data: {
      name: 'BUMDes BANYUBENING API',
      version: '1.0.0',
      docs: '/health',
      features: [
        'Admin Dashboard Full Control',
        'Financial System Audit-Ready',
        'Product Catalog Shopee-like',
        'WhatsApp Bot Queue',
        'Realtime Socket.IO',
        'Backup & Disaster Recovery',
      ],
    },
  });
});

// API Routes
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/identity`, identityRoutes);
app.use(`${API_PREFIX}/articles`, articleRoutes);
app.use(`${API_PREFIX}/program-kerja`, programKerjaRoutes);
app.use(`${API_PREFIX}/running-text`, runningTextRoutes);
app.use(`${API_PREFIX}/pengurus`, pengurusRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/portfolio`, portfolioRoutes);
app.use(`${API_PREFIX}/carousel`, carouselRoutes);
app.use(`${API_PREFIX}/themes`, themeRoutes);
app.use(`${API_PREFIX}/finance/coa`, coaRoutes);
app.use(`${API_PREFIX}/finance/journals`, journalRoutes);
app.use(`${API_PREFIX}/finance/ledger`, ledgerRoutes);
app.use(`${API_PREFIX}/finance/reports`, reportRoutes);
app.use(`${API_PREFIX}/whatsapp`, whatsappRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/search`, searchRoutes);
app.use(`${API_PREFIX}/storage`, storageRoutes);
app.use(`${API_PREFIX}/audit`, auditRoutes);
app.use(`${API_PREFIX}/backups`, backupRoutes);

// Public aggregation endpoint for homepage
app.get(`${API_PREFIX}/public/home`, async (_req, res, next) => {
  try {
    const { prisma } = await import('./config/database');
    const [identity, articles, products, runningTexts, pengurus, carousel, portfolio, programKerja, themes] = await Promise.all([
      prisma.identity.findFirst(),
      prisma.article.findMany({ where: { isPublished: true }, take: 6, orderBy: { publishedAt: 'desc' } }),
      prisma.product.findMany({ where: { isActive: true }, take: 12, orderBy: { soldCount: 'desc' }, include: { images: true } }),
      prisma.runningText.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
      prisma.pengurus.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
      prisma.carouselItem.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
      prisma.portfolio.findMany({ where: { isPublished: true }, take: 6, orderBy: { createdAt: 'desc' } }),
      prisma.programKerja.findMany({ where: { isPublished: true }, take: 4, orderBy: { createdAt: 'desc' } }),
      prisma.themeConfig.findFirst({ where: { isActive: true } }),
    ]);

    res.json({
      success: true,
      data: {
        identity,
        articles,
        products,
        runningTexts,
        pengurus,
        carousel,
        portfolio,
        programKerja,
        activeTheme: themes,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (e) { next(e); }
});

// 404 and error handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
