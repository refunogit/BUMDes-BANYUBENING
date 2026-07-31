import { prisma } from '../../shared/prisma/client';
import { AdminUser } from '@prisma/client';

export class AuthRepository {
  async findAdminByEmail(email: string): Promise<AdminUser | null> {
    return prisma.adminUser.findUnique({
      where: { email },
    });
  }

  async createOrUpdateAdmin(data: { email: string; passwordHash: string; pinHash: string; phone?: string }): Promise<AdminUser> {
    return prisma.adminUser.upsert({
      where: { email: data.email },
      update: {
        passwordHash: data.passwordHash,
        pinHash: data.pinHash,
        phone: data.phone,
      },
      create: data,
    });
  }

  async saveOtpCode(email: string, phone: string, code: string, ttlSeconds = 180): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await prisma.otpCode.create({
      data: {
        email,
        phone,
        code,
        expiresAt,
        attempts: 0,
      },
    });
  }

  async findValidOtp(email: string, code: string) {
    const now = new Date();
    return prisma.otpCode.findFirst({
      where: {
        email,
        code,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteOtp(id: string) {
    return prisma.otpCode.delete({ where: { id } });
  }
}

export const authRepository = new AuthRepository();
