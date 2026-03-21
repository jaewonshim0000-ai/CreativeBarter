import axios from 'axios';
import prisma from '../utils/prisma';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

// ============================================================
// User Wants Management
// ============================================================

/** Add a "want" (skill the user is looking for) */
export async function addUserWant(userId: string, skillName: string, description?: string, priority: number = 5) {
  return prisma.userWant.upsert({
    where: { userId_skillName: { userId, skillName } },
    update: { description, priority },
    create: { userId, skillName, description, priority },
  });
}

/** Remove a want */
export async function removeUserWant(userId: string, skillName: string) {
  return prisma.userWant.deleteMany({ where: { userId, skillName } });
}

/** Get all wants for a user */
export async function getUserWants(userId: string) {
  return prisma.userWant.findMany({
    where: { userId },
    orderBy: { priority: 'desc' },
  });
}

// ============================================================
// Circular Barter Discovery
// ============================================================

/**
 * Find circular barter opportunities by:
 * 1. Loading all users with their skills (has) and wants
 * 2. Sending to the AI service graph algorithm
 * 3. Returning detected chains
 */
export async function findCircularBarters(maxChainLength: number = 5, maxResults: number = 10) {
  // Load all users who have both skills AND wants
  const users = await prisma.user.findMany({
    where: {
      AND: [
        { skills: { some: {} } },
        { wants: { some: {} } },
      ],
    },
    include: {
      skills: { include: { skill: true } },
      wants: true,
    },
  });

  if (users.length < 3) {
    return { chains: [], total_users_analyzed: users.length, source: 'insufficient_users' };
  }

  // Build the graph input for the AI service
  const userNodes = users.map((u: any) => ({
    user_id: u.id,
    name: u.name,
    has_skills: u.skills.map((us: any) => us.skill.name),
    wants_skills: u.wants.map((w: any) => w.skillName),
  }));

  try {
    const response = await axios.post(`${config.aiServiceUrl}/find-circular-barters`, {
      users: userNodes,
      max_chain_length: maxChainLength,
      max_results: maxResults,
    }, { timeout: 30000 });

    return response.data;
  } catch (err: any) {
    console.warn('[CircularBarter] AI service unavailable:', err?.message);
    return { chains: [], total_users_analyzed: users.length, source: 'error' };
  }
}

// ============================================================
// Barter Chain CRUD
// ============================================================

/** Create a barter chain from a detected circular opportunity */
export async function createBarterChain(
  initiatedBy: string,
  title: string,
  description: string | undefined,
  participants: {
    userId: string;
    position: number;
    givesSkill: string;
    givesDescription?: string;
    givesToUserId: string;
    receivesSkill: string;
    receivesDescription?: string;
    receivesFromUserId: string;
  }[],
  confidenceScore?: number
) {
  if (participants.length < 3) {
    throw new AppError('A circular barter chain needs at least 3 participants.', 400);
  }

  // Verify all users exist
  const userIds = [...new Set(participants.map((p) => p.userId))];
  const existingUsers = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true },
  });

  if (existingUsers.length !== userIds.length) {
    throw new AppError('One or more participants not found.', 404);
  }

  // Create chain with participants in a transaction
  const chain = await prisma.barterChain.create({
    data: {
      title,
      description,
      chainLength: participants.length,
      initiatedBy,
      confidenceScore,
      status: 'pending_acceptance',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      participants: {
        create: participants.map((p) => ({
          userId: p.userId,
          position: p.position,
          givesSkill: p.givesSkill,
          givesDescription: p.givesDescription,
          givesToUserId: p.givesToUserId,
          receivesSkill: p.receivesSkill,
          receivesDescription: p.receivesDescription,
          receivesFromUserId: p.receivesFromUserId,
          // Auto-accept for the initiator
          status: p.userId === initiatedBy ? 'accepted' : 'pending',
          acceptedAt: p.userId === initiatedBy ? new Date() : null,
        })),
      },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, profileImageUrl: true } },
          givesToUser: { select: { id: true, name: true } },
          receivesFromUser: { select: { id: true, name: true } },
        },
        orderBy: { position: 'asc' },
      },
      initiator: { select: { id: true, name: true, profileImageUrl: true } },
    },
  });

  return chain;
}

/** Get a single barter chain by ID */
export async function getBarterChain(chainId: string) {
  const chain = await prisma.barterChain.findUnique({
    where: { id: chainId },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, profileImageUrl: true, avgRating: true } },
          givesToUser: { select: { id: true, name: true } },
          receivesFromUser: { select: { id: true, name: true } },
        },
        orderBy: { position: 'asc' },
      },
      initiator: { select: { id: true, name: true, profileImageUrl: true } },
    },
  });

  if (!chain) throw new AppError('Barter chain not found.', 404);
  return chain;
}

/** Get all chains a user is involved in */
export async function getUserChains(userId: string, status?: string) {
  const where: any = {
    participants: { some: { userId } },
  };
  if (status) where.status = status;

  return prisma.barterChain.findMany({
    where,
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, profileImageUrl: true } },
        },
        orderBy: { position: 'asc' },
      },
      initiator: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/** Accept or reject participation in a barter chain */
export async function respondToChain(chainId: string, userId: string, accept: boolean) {
  const participant = await prisma.barterChainParticipant.findFirst({
    where: { chainId, userId },
  });

  if (!participant) throw new AppError('You are not a participant in this chain.', 403);
  if (participant.status !== 'pending') throw new AppError('Already responded to this chain.', 400);

  await prisma.barterChainParticipant.update({
    where: { id: participant.id },
    data: {
      status: accept ? 'accepted' : 'rejected',
      acceptedAt: accept ? new Date() : null,
    },
  });

  if (!accept) {
    // If anyone rejects, cancel the whole chain
    await prisma.barterChain.update({
      where: { id: chainId },
      data: { status: 'cancelled' },
    });
    return { status: 'chain_cancelled', reason: 'A participant declined.' };
  }

  // Check if all participants have accepted
  const allParticipants = await prisma.barterChainParticipant.findMany({
    where: { chainId },
  });

  const allAccepted = allParticipants.every((p: any) => p.status === 'accepted');

  if (allAccepted) {
    await prisma.barterChain.update({
      where: { id: chainId },
      data: { status: 'active' },
    });
    return { status: 'chain_active', reason: 'All participants accepted! Chain is now active.' };
  }

  return { status: 'accepted', reason: 'Waiting for other participants.' };
}

/** Mark a chain as completed */
export async function completeChain(chainId: string, userId: string) {
  const chain = await prisma.barterChain.findUnique({ where: { id: chainId } });
  if (!chain) throw new AppError('Chain not found.', 404);
  if (chain.initiatedBy !== userId) throw new AppError('Only the initiator can complete a chain.', 403);
  if (chain.status !== 'active') throw new AppError('Chain must be active to complete.', 400);

  await prisma.barterChainParticipant.updateMany({
    where: { chainId },
    data: { status: 'completed', completedAt: new Date() },
  });

  return prisma.barterChain.update({
    where: { id: chainId },
    data: { status: 'completed', completedAt: new Date() },
  });
}
