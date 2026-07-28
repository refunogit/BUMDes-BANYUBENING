import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

export const authRepository = {
  async findUserByUsername(username: string) {
    return prisma.user.findUnique({ where: { username } });
  },

  async findUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  async createUser(data: any) {
    return prisma.user.create({ data });
  },

  async updateLastLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  },

  async findAllUsers() {
    return prisma.user.findMany({
      select: { id: true, username: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async updateUser(id: string, data: any) {
    return prisma.user.update({ where: { id }, data });
  },

  async deleteUser(id: string) {
    return prisma.user.delete({ where: { id } });
  },
};
