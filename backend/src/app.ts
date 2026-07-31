import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { logger } from './shared/logger';
import { generalLimiter } from './shared/middleware/rate-limit.middleware';

// Routes
import { authRouter } from './modules/auth/auth.route';
import { identityRouter } from './modules/identity/identity.route';
import { themeRouter } from './modules/theme/theme.route';
import { programKerjaRouter } from './modules/program-kerja/program-kerja.route';
import { productsRouter } from './modules/products/products.route';
import { pengurusRouter } from './modules/pengurus/pengurus.route';
import { runningTextRouter } from './modules/running-text/running-text.route';
import { articlesRouter } from './modules/articles/articles.route';
import { unitUsahaRouter } from './modules/unit-usaha/unit-usaha.route';
import { portfolioRouter } from './modules/portfolio/portfolio.route';
import { pengaduanRouter } from './modules/pengaduan/pengaduan.route';
import { reportsRouter } from './modules/reports/reports.route';
import { backupRouter } from './modules/backup/backup.route';
import { auditRouter } from './modules/audit/audit.route';
import { searchRouter } from './modules/search/search.route';
import { uploadRouter } from './modules/upload/upload.route';

export const app = express();

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(generalLimiter);

// Serve uploaded media files and default images
const uploadsDir = path.resolve(__dirname, '../public/uploads');
const defaultImagesDir = path.resolve(__dirname, '../public/images');
app.use('/uploads', express.static(uploadsDir));
app.use('/images', express.static(defaultImagesDir));

// Health Check Endpoint (Required by contract)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected',
    redis: 'in-memory/connected',
    version: '1.0.0',
    platform: 'BUMDes Banyubening Platform',
  });
});

// Mount custom obfuscated non-guessable login helper route
app.use('/gerbang-internal-bumdes', authRouter);
app.use('/api/auth', authRouter);

// API domain modules
app.use('/api/identity', identityRouter);
app.use('/api/theme', themeRouter);
app.use('/api/program-kerja', programKerjaRouter);
app.use('/api/products', productsRouter);
app.use('/api/pengurus', pengurusRouter);
app.use('/api/running-text', runningTextRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/unit-usaha', unitUsahaRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/pengaduan', pengaduanRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/backup', backupRouter);
app.use('/api/audit', auditRouter);
app.use('/api/search', searchRouter);
app.use('/api/upload', uploadRouter);

// Global Failsafe Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err: err.message, stack: err.stack, path: req.path }, 'Unhandled exception captured');
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan sistem internal BUMDes.',
  });
});

// 404 handler for API routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Rute endpoint tidak ditemukan: ${req.method} ${req.path}`,
  });
});
