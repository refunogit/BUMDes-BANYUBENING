import { Router } from 'express';
import { z } from 'zod';
import { programKerjaController } from './program-kerja.controller';
import { verifyToken, requireAdmin, optionalAuth } from '../../shared/middleware/auth.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';

const router = Router();

const createProgramSchema = z.object({
  title: z.string().min(1, 'Judul program kerja wajib diisi'),
  date: z.string().min(1, 'Tanggal program kerja wajib diisi'),
  teamName: z.string().min(1, 'Nama tim/pelaksana wajib diisi'),
  isCommentEnabled: z.boolean().optional(),
  blocks: z
    .array(
      z.object({
        type: z.enum(['text', 'image']),
        content: z.string().min(1, 'Konten blok wajib diisi'),
        orderIndex: z.number().optional(),
      })
    )
    .min(1, 'Minimal 1 blok konten teks atau gambar'),
});

const commentSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  text: z.string().min(1, 'Isi komentar tidak boleh kosong'),
  parentId: z.string().optional(),
});

router.get('/', (req, res) => programKerjaController.getList(req, res));
router.get('/:id', optionalAuth, (req, res) => programKerjaController.getById(req, res));
router.post('/', verifyToken, requireAdmin, validateBody(createProgramSchema), (req, res) =>
  programKerjaController.create(req, res)
);
router.put('/:id', verifyToken, requireAdmin, (req, res) => programKerjaController.update(req, res));
router.delete('/:id', verifyToken, requireAdmin, (req, res) => programKerjaController.delete(req, res));
router.get('/:id/comments', optionalAuth, (req, res) => programKerjaController.getComments(req, res));
router.post('/:id/comments', validateBody(commentSchema), (req, res) =>
  programKerjaController.addComment(req, res)
);
router.delete('/comments/:commentId', verifyToken, requireAdmin, (req, res) =>
  programKerjaController.deleteComment(req, res)
);

export const programKerjaRouter = router;
