import { Request, Response } from 'express';
import { authService } from './auth.service';
import { recordFailedLoginAttempt, clearFailedLoginAttempt } from '../../shared/middleware/rate-limit.middleware';
import { logger } from '../../shared/logger';

export class AuthController {
  async loginEmail(req: Request, res: Response) {
    const { email, password } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    try {
      const result = await authService.validateEmailPassword(email, password);
      await clearFailedLoginAttempt(String(ip));
      return res.status(200).json(result);
    } catch (error: any) {
      await recordFailedLoginAttempt(String(ip));
      logger.warn({ err: error.message, ip }, 'Email/Password login attempt failed');
      return res.status(401).json({
        success: false,
        message: error.message || 'Otentikasi email/kata sandi gagal.',
      });
    }
  }

  async verifyOtp(req: Request, res: Response) {
    const { email, otpCode } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    try {
      const result = await authService.verifyOtp(email, otpCode);
      await clearFailedLoginAttempt(String(ip));
      return res.status(200).json(result);
    } catch (error: any) {
      await recordFailedLoginAttempt(String(ip));
      return res.status(401).json({
        success: false,
        message: error.message || 'Verifikasi OTP gagal.',
      });
    }
  }

  async verifyPin(req: Request, res: Response) {
    const { otpSessionToken, pin } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    try {
      const result = await authService.verifyPin(otpSessionToken, pin);
      await clearFailedLoginAttempt(String(ip));

      // Set secure HTTP-only cookie for access token as well
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      await recordFailedLoginAttempt(String(ip));
      return res.status(401).json({
        success: false,
        message: error.message || 'Verifikasi 10-Digit PIN gagal.',
      });
    }
  }

  async refreshToken(req: Request, res: Response) {
    const refreshToken = req.body.refreshToken || req.cookies?.refresh_token;

    try {
      const result = await authService.refreshToken(refreshToken);
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Refresh token gagal.',
      });
    }
  }

  async logout(req: Request, res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return res.status(200).json({
      success: true,
      message: 'Anda berhasil keluar dari sesi Admin BUMDes.',
    });
  }

  async getMe(req: any, res: Response) {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  }
}

export const authController = new AuthController();
