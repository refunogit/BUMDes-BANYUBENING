import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { verifyToken, requireAdmin } from '../../shared/middleware/auth.middleware';
import { logger } from '../../shared/logger';

const router = Router();

const uploadsDir = path.resolve(__dirname, '../../../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    cb(null, `${basename}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.post('/', verifyToken, requireAdmin, upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'File gambar wajib diunggah.' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  logger.info({ fileUrl, originalName: req.file.originalname }, 'Image uploaded successfully via admin dashboard');
  return res.status(201).json({
    success: true,
    url: fileUrl,
    message: 'File berhasil diunggah.',
  });
});

export const uploadRouter = router;
