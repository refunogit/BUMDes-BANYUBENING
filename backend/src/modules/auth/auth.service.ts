import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authRepository } from './auth.repository';
import { fonnteService } from '../../shared/fonnte/fonnte.service';
import { cache } from '../../shared/redis/cache';
import { logger, logAudit } from '../../shared/logger';

export interface LoginEmailResponse {
  success: boolean;
  message: string;
  step: 'OTP_REQUIRED';
  phoneMasked: string;
  devOtp?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  step: 'PIN_REQUIRED';
  otpSessionToken: string;
}

export interface VerifyPinResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export class AuthService {
  private getMasterEmail() {
    return process.env.ADMIN_EMAIL || 'admin@bumdesbanyubening.id';
  }

  private getMasterPhone() {
    return process.env.ADMIN_WA_NUMBER || '081234567890';
  }

  private async checkPassword(inputPassword: string, hash: string): Promise<boolean> {
    if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
      return bcrypt.compare(inputPassword, hash);
    }
    return inputPassword === hash;
  }

  private async checkPin(inputPin: string, hash: string): Promise<boolean> {
    if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
      return bcrypt.compare(inputPin, hash);
    }
    return inputPin === hash;
  }

  async validateEmailPassword(email: string, password: string): Promise<LoginEmailResponse> {
    const masterEmail = this.getMasterEmail();
    if (email.toLowerCase().trim() !== masterEmail.toLowerCase().trim()) {
      logger.warn({ email }, 'Login attempt with unauthorized email rejected');
      throw new Error('Email tidak terdaftar sebagai Administrator Utama BUMDes Banyubening.');
    }

    const expectedHash = process.env.ADMIN_PASSWORD_HASH || 'BanyuBening2026!';
    let isPasswordValid = await this.checkPassword(password, expectedHash);

    // Also check against DB if exists
    if (!isPasswordValid) {
      const dbUser = await authRepository.findAdminByEmail(masterEmail);
      if (dbUser) {
        isPasswordValid = await bcrypt.compare(password, dbUser.passwordHash);
      }
    }

    if (!isPasswordValid) {
      logger.warn({ email }, 'Login attempt with incorrect password');
      throw new Error('Kata sandi yang Anda masukkan salah.');
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const phone = this.getMasterPhone();

    // Store in Redis/Cache for 180 seconds (3 minutes)
    await cache.set(`otp_code_${masterEmail}`, otpCode, 180);
    await authRepository.saveOtpCode(masterEmail, phone, otpCode, 180);

    // Send via Fonnte Gateway
    await fonnteService.sendOtp(phone, otpCode);

    const masked = phone.length > 5
      ? `${phone.slice(0, 3)}****${phone.slice(-3)}`
      : '0812****7890';

    const isDev = process.env.NODE_ENV !== 'production';

    return {
      success: true,
      message: `Kode OTP 6-digit telah dikirim ke WhatsApp Anda (${masked}). Berlaku 3 menit.`,
      step: 'OTP_REQUIRED',
      phoneMasked: masked,
      devOtp: isDev ? otpCode : undefined,
    };
  }

  async verifyOtp(email: string, otpCode: string): Promise<VerifyOtpResponse> {
    const masterEmail = this.getMasterEmail();
    if (email.toLowerCase().trim() !== masterEmail.toLowerCase().trim()) {
      throw new Error('Email administrator tidak valid.');
    }

    const cachedOtp = await cache.get(`otp_code_${masterEmail}`);
    const dbOtp = await authRepository.findValidOtp(masterEmail, otpCode);

    if (cachedOtp !== otpCode && !dbOtp) {
      throw new Error('Kode OTP tidak valid atau sudah kedaluwarsa (berlaku 3 menit).');
    }

    if (dbOtp) {
      await authRepository.deleteOtp(dbOtp.id);
    }
    await cache.del(`otp_code_${masterEmail}`);

    // Generate a temporary JWT token valid for 5 minutes for PIN validation step
    const otpSessionToken = jwt.sign(
      { email: masterEmail, step: 'PIN_REQUIRED' },
      process.env.JWT_ACCESS_SECRET || 'bumdes_banyubening_access_secret_enterprise_key_2026_super_secure',
      { expiresIn: '5m' }
    );

    return {
      success: true,
      message: 'OTP WhatsApp verifikasi berhasil. Silakan masukkan 10-Digit PIN keamanan pada Numpad.',
      step: 'PIN_REQUIRED',
      otpSessionToken,
    };
  }

  async verifyPin(otpSessionToken: string, pin: string): Promise<VerifyPinResponse> {
    if (!pin || pin.length !== 10) {
      throw new Error('PIN Keamanan wajib 10 digit angka.');
    }

    let decoded: any;
    try {
      decoded = jwt.verify(
        otpSessionToken,
        process.env.JWT_ACCESS_SECRET || 'bumdes_banyubening_access_secret_enterprise_key_2026_super_secure'
      );
    } catch (err) {
      throw new Error('Sesi OTP Anda telah berakhir. Silakan login kembali dari awal.');
    }

    if (decoded.step !== 'PIN_REQUIRED' || decoded.email !== this.getMasterEmail()) {
      throw new Error('Sesi otentikasi tidak sah.');
    }

    const expectedPinHash = process.env.ADMIN_PIN || '1234567890';
    let isPinValid = await this.checkPin(pin, expectedPinHash);

    if (!isPinValid) {
      const dbUser = await authRepository.findAdminByEmail(this.getMasterEmail());
      if (dbUser) {
        isPinValid = await bcrypt.compare(pin, dbUser.pinHash);
      }
    }

    if (!isPinValid) {
      logger.warn({ email: decoded.email }, 'Invalid 10-digit PIN entered');
      throw new Error('10-Digit PIN keamanan tidak cocok.');
    }

    // Issue production Access and Refresh tokens
    const userPayload = {
      id: 'master-admin-bumdes-id',
      email: this.getMasterEmail(),
      role: 'SUPER_ADMIN',
    };

    const accessToken = jwt.sign(
      userPayload,
      process.env.JWT_ACCESS_SECRET || 'bumdes_banyubening_access_secret_enterprise_key_2026_super_secure',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      userPayload,
      process.env.JWT_REFRESH_SECRET || 'bumdes_banyubening_refresh_secret_enterprise_key_2026_super_secure',
      { expiresIn: '7d' }
    );

    logAudit('LOGIN_SUCCESS', 'AdminUser', userPayload.id, userPayload.email, { ip: 'authenticated' });

    return {
      success: true,
      message: 'Otentikasi 2FA berhasil! Selamat datang di Gerbang Internal BUMDes Banyubening.',
      accessToken,
      refreshToken,
      user: userPayload,
    };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new Error('Refresh token tidak ditemukan.');
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'bumdes_banyubening_refresh_secret_enterprise_key_2026_super_secure'
      ) as { id: string; email: string; role: string };

      const accessToken = jwt.sign(
        { id: decoded.id, email: decoded.email, role: decoded.role },
        process.env.JWT_ACCESS_SECRET || 'bumdes_banyubening_access_secret_enterprise_key_2026_super_secure',
        { expiresIn: '15m' }
      );

      return {
        success: true,
        accessToken,
      };
    } catch (err) {
      throw new Error('Refresh token tidak valid atau sudah kedaluwarsa.');
    }
  }
}

export const authService = new AuthService();
