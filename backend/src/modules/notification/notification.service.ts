import { prisma } from '../../config/database';
import { queueService } from '../../config/redis';
import { logger } from '../../config/pino';

export const notificationService = {
  async list(userId?: string, query: any = {}) {
    const where: any = {};
    if (userId) where.userId = userId;
    if (query.isRead !== undefined) where.isRead = query.isRead === 'true';

    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(query.limit || '20'),
        skip: (parseInt(query.page || '1') - 1) * parseInt(query.limit || '20'),
      }),
      prisma.notification.count({ where }),
    ]);

    return { data, total };
  },

  async create(data: { userId?: string; title: string; message: string; type?: string; linkUrl?: string }) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'INFO',
        linkUrl: data.linkUrl,
      },
    });

    // Enqueue for realtime + whatsapp if needed
    await queueService.enqueue('notification:dispatch', notification);

    logger.info({ notificationId: notification.id }, 'Notification created');

    return notification;
  },

  async markAsRead(id: string, userId?: string) {
    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing) throw new Error('Notification not found');
    if (userId && existing.userId && existing.userId !== userId) throw new Error('Forbidden');

    return prisma.notification.update({ where: { id }, data: { isRead: true } });
  },

  async markAllAsRead(userId?: string) {
    const where: any = { isRead: false };
    if (userId) where.userId = userId;
    return prisma.notification.updateMany({ where, data: { isRead: true } });
  },

  async delete(id: string) {
    await prisma.notification.delete({ where: { id } });
    return { message: 'Notification deleted' };
  },
};
