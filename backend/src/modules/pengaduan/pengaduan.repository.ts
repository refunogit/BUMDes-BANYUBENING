import { prisma } from '../../shared/prisma/client';
import { PengaduanMessage } from '@prisma/client';

export class PengaduanRepository {
  async saveMessage(data: {
    senderNumber: string;
    senderName: string;
    message: string;
    direction: 'INCOMING' | 'OUTGOING';
    status?: 'UNREAD' | 'READ' | 'REPLIED';
  }): Promise<PengaduanMessage> {
    return prisma.pengaduanMessage.create({
      data: {
        senderNumber: data.senderNumber,
        senderName: data.senderName || data.senderNumber,
        message: data.message,
        direction: data.direction,
        status: data.status || (data.direction === 'INCOMING' ? 'UNREAD' : 'REPLIED'),
      },
    });
  }

  async getConversationSummary() {
    // Get unique senderNumbers with latest message preview and unread count
    const messages = await prisma.pengaduanMessage.findMany({
      orderBy: { timestamp: 'desc' },
    });

    const map = new Map<
      string,
      {
        senderNumber: string;
        senderName: string;
        lastMessage: string;
        lastTimestamp: Date;
        unreadCount: number;
      }
    >();

    for (const msg of messages) {
      if (!map.has(msg.senderNumber)) {
        map.set(msg.senderNumber, {
          senderNumber: msg.senderNumber,
          senderName: msg.senderName,
          lastMessage: msg.message,
          lastTimestamp: msg.timestamp,
          unreadCount: 0,
        });
      }
      const existing = map.get(msg.senderNumber)!;
      if (msg.direction === 'INCOMING' && msg.status === 'UNREAD') {
        existing.unreadCount += 1;
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => b.lastTimestamp.getTime() - a.lastTimestamp.getTime()
    );
  }

  async getConversationByNumber(senderNumber: string): Promise<PengaduanMessage[]> {
    return prisma.pengaduanMessage.findMany({
      where: { senderNumber },
      orderBy: { timestamp: 'asc' },
    });
  }

  async markConversationAsRead(senderNumber: string): Promise<void> {
    await prisma.pengaduanMessage.updateMany({
      where: {
        senderNumber,
        direction: 'INCOMING',
        status: 'UNREAD',
      },
      data: { status: 'READ' },
    });
  }
}

export const pengaduanRepository = new PengaduanRepository();
