import { Router } from 'express';
import { whatsappController } from './whatsapp.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { configSchema, sendMessageSchema, bulkMessageSchema } from './whatsapp.validation';
import { whatsappRateLimiter } from '../../middlewares/rateLimiter.middleware';

const router = Router();

router.post('/webhook', whatsappRateLimiter, whatsappController.webhook);
router.post('/test', whatsappController.testCommand);

router.use(authenticate);
router.get('/config', whatsappController.getConfig);
router.put('/config', validate(configSchema), whatsappController.updateConfig);
router.post('/send', validate(sendMessageSchema), whatsappController.sendMessage);
router.post('/bulk', validate(bulkMessageSchema), whatsappController.sendBulk);
router.get('/logs', whatsappController.getLogs);

export default router;
