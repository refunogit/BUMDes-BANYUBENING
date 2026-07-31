import { Router } from 'express';
import { z } from 'zod';
import { identityController } from './identity.controller';
import { verifyToken, requireAdmin } from '../../shared/middleware/auth.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';

const router = Router();

const updateIdentitySchema = z.object({
  name: z.string().optional(),
  villageName: z.string().optional(),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  heroBackgroundUrl: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  description: z.string().optional(),
  mapsEmbedUrl: z.string().optional(),
});

router.get('/', (req, res) => identityController.getIdentity(req, res));
router.put('/', verifyToken, requireAdmin, validateBody(updateIdentitySchema), (req, res) =>
  identityController.updateIdentity(req, res)
);

export const identityRouter = router;
