import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../config/pino';
import { env } from '../config/env';
import { verifyAccessToken } from '../config/jwt';

export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN.split(','),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Auth middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      // Allow public connections for public updates, but mark as guest
      (socket as any).user = null;
      return next();
    }
    try {
      const payload = verifyAccessToken(token);
      (socket as any).user = payload;
      next();
    } catch {
      // Don't block, allow as guest for public events
      (socket as any).user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user;
    logger.info({ socketId: socket.id, userId: user?.userId || 'guest' }, '🔌 Socket connected');

    // Join user-specific room
    if (user) {
      socket.join(`user:${user.userId}`);
      socket.join(`role:${user.role}`);
    }

    // Public room
    socket.join('public');

    // Dashboard live updates
    socket.on('dashboard:subscribe', () => {
      socket.join('dashboard');
      logger.info({ socketId: socket.id }, 'Subscribed to dashboard');
    });

    socket.on('dashboard:unsubscribe', () => {
      socket.leave('dashboard');
    });

    // Admin real-time
    socket.on('admin:subscribe', () => {
      if (user && ['ADMIN','SUPER_ADMIN'].includes(user.role)) {
        socket.join('admin');
      }
    });

    // Ping for health
    socket.on('ping', (cb) => {
      if (typeof cb === 'function') cb({ pong: true, timestamp: new Date().toISOString() });
    });

    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, reason }, '🔌 Socket disconnected');
    });
  });

  logger.info('✅ Socket.IO initialized with realtime system');

  return io;
}

// Helper to emit dashboard stats
export async function emitDashboardUpdate(io: SocketIOServer, stats: any) {
  io.to('dashboard').emit('dashboard:update', stats);
  io.to('admin').emit('dashboard:update', stats);
}
