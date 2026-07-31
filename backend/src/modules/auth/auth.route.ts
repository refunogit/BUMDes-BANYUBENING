import { Router } from 'express';
import { z } from 'zod';
import { authController } from './auth.controller';
import { validateBody } from '../../shared/middleware/validate.middleware';
import { loginLimiter, checkIpLockout } from '../../shared/middleware/rate-limit.middleware';
import { verifyBotFilter } from '../../shared/middleware/bot-filter.middleware';
import { verifyToken, requireAdmin } from '../../shared/middleware/auth.middleware';

const router = Router();

const loginEmailSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
  'cf-turnstile-response': z.string().optional(),
  'g-recaptcha-response': z.string().optional(),
  captchaToken: z.string().optional(),
  turnstileToken: z.string().optional(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otpCode: z.string().length(6, 'Kode OTP wajib 6 digit'),
});

const verifyPinSchema = z.object({
  otpSessionToken: z.string().min(1, 'Token sesi OTP diperlukan'),
  pin: z.string().length(10, 'PIN keamanan wajib 10 digit'),
});

// Step 1: Email + Password + Turnstile Bot Verification -> Sends Fonnte WhatsApp OTP
router.post(
  '/login-email',
  checkIpLockout,
  loginLimiter,
  verifyBotFilter,
  validateBody(loginEmailSchema),
  (req, res) => authController.loginEmail(req, res)
);

// Step 2: WhatsApp 6-digit OTP verification (3-min TTL)
router.post(
  '/verify-otp',
  checkIpLockout,
  loginLimiter,
  validateBody(verifyOtpSchema),
  (req, res) => authController.verifyOtp(req, res)
);

// Step 3: 10-Digit PIN Floating Numpad verification -> Issues Access & Refresh tokens
router.post(
  '/verify-pin',
  checkIpLockout,
  loginLimiter,
  validateBody(verifyPinSchema),
  (req, res) => authController.verifyPin(req, res)
);

router.post('/refresh', (req, res) => authController.refreshToken(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));
router.get('/me', verifyToken, requireAdmin, (req, res) => authController.getMe(req, res));

export const authRouter = router;
