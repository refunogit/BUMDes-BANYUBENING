import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { logger } from '../logger';

export const verifyBotFilter = async (req: Request, res: Response, next: NextFunction) => {
  const isDev = process.env.NODE_ENV !== 'production';
  const token =
    req.body['cf-turnstile-response'] ||
    req.body['g-recaptcha-response'] ||
    req.body.captchaToken ||
    req.body.turnstileToken;

  // In non-production or test mode, accept standard demo/test tokens
  if (isDev && (!token || token === 'demo_turnstile_token' || token === 'test-token' || token === 'demo-token')) {
    return next();
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Gagal verifikasi keamanan anti-bot. Token CAPTCHA tidak ditemukan.',
    });
  }

  try {
    const response = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: req.ip || '',
      }),
      { timeout: 5000 }
    );

    if (response.data.success) {
      return next();
    } else {
      logger.warn({ data: response.data }, 'Turnstile / Bot filter verification failed');
      return res.status(403).json({
        success: false,
        message: 'Verifikasi keamanan anti-bot tidak valid. Harap coba lagi.',
      });
    }
  } catch (err: any) {
    // If external verification network fails in dev/sandbox, fallback to allow in development
    if (isDev) {
      logger.info('External Turnstile API unreachable in sandbox; allowing in dev mode');
      return next();
    }
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memverifikasi keamanan anti-bot.',
    });
  }
};
