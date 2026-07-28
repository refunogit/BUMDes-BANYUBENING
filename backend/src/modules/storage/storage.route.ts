import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middlewares/auth.middleware';
import { storageProvider } from '../../config/storage';
import { successResponse } from '../../utils/response';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

router.use(authenticate);

router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    const file = (req as any).file as Express.Multer.File;
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const folder = (req.body.folder as string) || 'general';
    const url = await storageProvider.save(file, folder);
    res.json(successResponse({ url, filename: file.originalname, size: file.size }));
  } catch (e) { next(e); }
});

router.post('/upload-multiple', upload.array('files', 10), async (req, res, next) => {
  try {
    const files = (req as any).files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    const folder = (req.body.folder as string) || 'general';
    const urls = [];
    for (const file of files) {
      const url = await storageProvider.save(file, folder);
      urls.push({ url, filename: file.originalname, size: file.size });
    }
    res.json(successResponse(urls));
  } catch (e) { next(e); }
});

export default router;
