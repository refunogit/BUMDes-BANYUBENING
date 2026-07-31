import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../logger';

let io: SocketIOServer | null = null;

export const initSocket = (server: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'New Socket.IO client connected');

    socket.on('join_admin_room', () => {
      socket.join('admin_dashboard');
      logger.info({ socketId: socket.id }, 'Socket joined admin_dashboard room');
    });

    socket.on('join_public_room', () => {
      socket.join('public_website');
      logger.info({ socketId: socket.id }, 'Socket joined public_website room');
    });

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Socket client disconnected');
    });
  });

  // Start real-time Tetesan Embun Pagi clock broadcaster
  setInterval(() => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour12: false });
    const dateString = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    io?.emit('clock_sync', { time: timeString, date: dateString, timestamp: now.toISOString() });
  }, 1000);

  logger.info('Socket.IO real-time server initialized');
  return io;
};

export const getIO = (): SocketIOServer | null => io;

export const emitContentUpdate = (entityType: string, data?: any) => {
  io?.emit('content_update', { entityType, data, timestamp: new Date().toISOString() });
  logger.info({ entityType }, 'Socket.IO event broadcast: content_update');
};

export const emitThemeUpdate = (themeName: string, themeData?: any) => {
  io?.emit('theme_update', { themeName, themeData, timestamp: new Date().toISOString() });
  logger.info({ themeName }, 'Socket.IO event broadcast: theme_update');
};

export const emitNewPengaduan = (message: any) => {
  io?.to('admin_dashboard').emit('new_pengaduan_message', message);
  io?.emit('new_pengaduan_message', message);
  logger.info({ id: message.id }, 'Socket.IO event broadcast: new_pengaduan_message');
};

export const emitPengaduanReply = (message: any) => {
  io?.to('admin_dashboard').emit('pengaduan_reply_sent', message);
  io?.emit('pengaduan_reply_sent', message);
  logger.info({ id: message.id }, 'Socket.IO event broadcast: pengaduan_reply_sent');
};
