import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import * as messageService from './message.service';

/**
 * Map of online userId -> socketId for real-time delivery.
 */
const onlineUsers = new Map<string, string>();

/**
 * Initialize Socket.IO event handlers for real-time messaging.
 */
export function setupSocketHandlers(io: SocketIOServer) {
  // Authenticate socket connections via JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
      (socket as any).userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    console.log(`[Socket] User connected: ${userId}`);

    // Track online status
    onlineUsers.set(userId, socket.id);
    io.emit('user:online', { userId });

    // ----------------------------------------------------------
    // Event: Send a message
    // ----------------------------------------------------------
    socket.on('message:send', async (data: {
      receiverId: string;
      content: string;
      projectId?: string;
    }) => {
      try {
        const message = await messageService.sendMessage(
          userId,
          data.receiverId,
          data.content,
          data.projectId
        );

        // Send to receiver if they're online
        const receiverSocketId = onlineUsers.get(data.receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('message:receive', message);
        }

        // Confirm to sender
        socket.emit('message:sent', message);
      } catch (error: any) {
        socket.emit('message:error', { error: error.message });
      }
    });

    // ----------------------------------------------------------
    // Event: Mark messages as read
    // ----------------------------------------------------------
    socket.on('message:read', async (data: { senderId: string }) => {
      // Notify the original sender that their messages were read
      const senderSocketId = onlineUsers.get(data.senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit('message:read-receipt', { readBy: userId });
      }
    });

    // ----------------------------------------------------------
    // Event: Typing indicator
    // ----------------------------------------------------------
    socket.on('typing:start', (data: { receiverId: string }) => {
      const receiverSocketId = onlineUsers.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing:start', { userId });
      }
    });

    socket.on('typing:stop', (data: { receiverId: string }) => {
      const receiverSocketId = onlineUsers.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing:stop', { userId });
      }
    });

    // ----------------------------------------------------------
    // Event: Disconnect
    // ----------------------------------------------------------
    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${userId}`);
      onlineUsers.delete(userId);
      io.emit('user:offline', { userId });
    });
  });
}
