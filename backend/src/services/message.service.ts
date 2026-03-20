import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

// ============================================================
// Service Functions
// ============================================================

/**
 * Send a message from one user to another, optionally linked to a project.
 */
export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string,
  projectId?: string
) {
  // Verify receiver exists
  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) throw new AppError('Recipient not found.', 404);

  return prisma.message.create({
    data: { senderId, receiverId, content, projectId },
    include: {
      sender: { select: { id: true, name: true, profileImageUrl: true } },
    },
  });
}

/**
 * Get conversation messages between two users, optionally filtered by project.
 */
export async function getConversation(
  userId: string,
  otherUserId: string,
  projectId?: string,
  page: number = 1,
  limit: number = 50
) {
  const skip = (page - 1) * limit;

  const where: any = {
    OR: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId },
    ],
  };

  if (projectId) where.projectId = projectId;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true, profileImageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.message.count({ where }),
  ]);

  // Mark unread messages as read
  await prisma.message.updateMany({
    where: {
      senderId: otherUserId,
      receiverId: userId,
      isRead: false,
    },
    data: { isRead: true },
  });

  return {
    messages: messages.reverse(), // oldest first for display
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Get all conversations for a user (latest message per unique partner).
 */
export async function getUserConversations(userId: string) {
  // Fetch the most recent message with each unique conversation partner
  const sentMessages = await prisma.message.findMany({
    where: { senderId: userId },
    distinct: ['receiverId'],
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, name: true, profileImageUrl: true } },
      receiver: { select: { id: true, name: true, profileImageUrl: true } },
      project: { select: { id: true, title: true } },
    },
  });

  const receivedMessages = await prisma.message.findMany({
    where: { receiverId: userId },
    distinct: ['senderId'],
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, name: true, profileImageUrl: true } },
      receiver: { select: { id: true, name: true, profileImageUrl: true } },
      project: { select: { id: true, title: true } },
    },
  });

  // Merge and deduplicate by partner ID
  const conversationMap = new Map<string, any>();

  [...sentMessages, ...receivedMessages].forEach((msg) => {
    const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    const existing = conversationMap.get(partnerId);
    if (!existing || new Date(msg.createdAt) > new Date(existing.createdAt)) {
      conversationMap.set(partnerId, {
        partnerId,
        partner: msg.senderId === userId ? msg.receiver : msg.sender,
        lastMessage: msg,
        project: msg.project,
      });
    }
  });

  return Array.from(conversationMap.values()).sort(
    (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
  );
}

/**
 * Get count of unread messages for a user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.message.count({
    where: { receiverId: userId, isRead: false },
  });
}
