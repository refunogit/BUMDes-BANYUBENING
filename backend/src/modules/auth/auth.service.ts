import bcrypt from 'bcryptjs';
import { authRepository } from './auth.repository';
import { AppError } from '../../middlewares/error.middleware';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../config/jwt';
import { prisma } from '../../config/database';
import { logger } from '../../config/pino';
import { env } from '../../config/env';

export const authService = {
  async login(username: string, password: string, ip?: string, userAgent?: string) {
    const user = await authRepository.findUserByUsername(username);
    if (!user) throw new AppError(401, 'Invalid credentials');

    if (!user.isActive) throw new AppError(403, 'Account disabled');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new AppError(401, 'Invalid credentials');

    const payload = { userId: user.id, username: user.username, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await authRepository.updateLastLogin(user.id);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        ipAddress: ip,
        userAgent,
        newValue: { username },
      },
    });

    logger.info({ userId: user.id }, 'User logged in');

    return {
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    };
  },

  async refresh(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const user = await authRepository.findUserById(payload.userId);
      if (!user || !user.isActive) throw new AppError(401, 'User not found or inactive');

      const newPayload = { userId: user.id, username: user.username, role: user.role };
      const accessToken = generateAccessToken(newPayload);
      const newRefreshToken = generateRefreshToken(newPayload);

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new AppError(401, 'Invalid refresh token');
    }
  },

  async createUser(data: { username: string; email: string; password: string; role?: any }) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username: data.username }, { email: data.email }] },
    });
    if (existing) throw new AppError(409, 'Username or email already exists');

    const hashed = await bcrypt.hash(data.password, 12);

    const user = await authRepository.createUser({
      username: data.username,
      email: data.email,
      password: hashed,
      role: data.role || 'ADMIN',
    });

    return { id: user.id, username: user.username, email: user.email, role: user.role };
  },

  async getAllUsers() {
    return authRepository.findAllUsers();
  },

  async verifyPin(pin: string) {
    if (env.PIN_CODE && pin === env.PIN_CODE) return true;

    const setting = await prisma.setting.findUnique({ where: { key: 'PIN_HASH' } });
    let hash = setting?.value || env.PIN_HASH;

    if (!hash) {
      // If no hash stored, compare plain
      if (env.PIN_CODE) return pin === env.PIN_CODE;
      throw new AppError(500, 'PIN not configured');
    }

    return bcrypt.compare(pin, hash);
  },

  async updatePin(oldPin: string, newPin: string, userId: string) {
    const isValid = await this.verifyPin(oldPin);
    if (!isValid) throw new AppError(401, 'Old PIN invalid');

    const newHash = await bcrypt.hash(newPin, 12);

    await prisma.setting.upsert({
      where: { key: 'PIN_HASH' },
      update: { value: newHash, updatedBy: userId },
      create: { key: 'PIN_HASH', value: newHash, isSecret: true, updatedBy: userId },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_PIN',
        entity: 'Setting',
        entityId: 'PIN_HASH',
      },
    });

    return { message: 'PIN updated successfully' };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
    });
    if (!user) throw new AppError(404, 'User not found');
    return user;
  },
};
