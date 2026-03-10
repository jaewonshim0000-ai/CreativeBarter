import axios from 'axios';
import prisma from '../utils/prisma';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

// ============================================================
// Service Functions
// ============================================================

/**
 * Create a match proposal (one user proposes to collaborate on a project).
 */
export async function createMatch(
  projectId: string,
  proposerId: string,
  receiverId: string,
  message?: string
) {
  // Verify the project exists
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError('Project not found.', 404);

  // Prevent self-matching
  if (proposerId === receiverId) {
    throw new AppError('Cannot propose a match with yourself.', 400);
  }

  // Check for duplicate match
  const existing = await prisma.match.findUnique({
    where: {
      projectId_proposerId_receiverId: { projectId, proposerId, receiverId },
    },
  });
  if (existing) throw new AppError('A match proposal already exists.', 409);

  // Optionally get AI match score
  let matchScore: number | null = null;
  try {
    matchScore = await getAIMatchScore(projectId, proposerId);
  } catch (err) {
    console.warn('[Match] AI scoring unavailable, proceeding without score.');
  }

  return prisma.match.create({
    data: {
      projectId,
      proposerId,
      receiverId,
      message,
      matchScore,
    },
    include: {
      project: { select: { id: true, title: true } },
      proposer: { select: { id: true, name: true, profileImageUrl: true } },
      receiver: { select: { id: true, name: true, profileImageUrl: true } },
    },
  });
}

/**
 * Update match status (accept, reject, cancel).
 */
export async function updateMatchStatus(
  matchId: string,
  userId: string,
  status: 'accepted' | 'rejected' | 'cancelled'
) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });

  if (!match) throw new AppError('Match not found.', 404);

  // Only the receiver can accept/reject; both parties can cancel
  if (status === 'accepted' || status === 'rejected') {
    if (match.receiverId !== userId) {
      throw new AppError('Only the receiver can accept or reject a match.', 403);
    }
  }

  return prisma.match.update({
    where: { id: matchId },
    data: { status },
  });
}

/**
 * Get all matches for a user (both proposed and received).
 */
export async function getUserMatches(userId: string, status?: string) {
  const where: any = {
    OR: [{ proposerId: userId }, { receiverId: userId }],
  };
  if (status) where.status = status;

  return prisma.match.findMany({
    where,
    include: {
      project: { select: { id: true, title: true, status: true } },
      proposer: { select: { id: true, name: true, profileImageUrl: true, avgRating: true } },
      receiver: { select: { id: true, name: true, profileImageUrl: true, avgRating: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get AI-generated match recommendations for a project.
 * Calls the Python AI microservice for scoring.
 */
export async function getProjectRecommendations(projectId: string) {
  try {
    const response = await axios.post(`${config.aiServiceUrl}/match/recommend`, {
      project_id: projectId,
    });
    return response.data;
  } catch (err) {
    console.warn('[Match] AI recommendation service unavailable.');
    // Fallback: return basic skill-matching results
    return { recommendations: [], source: 'fallback' };
  }
}

/**
 * Internal: Request AI match score between a user and a project.
 */
async function getAIMatchScore(projectId: string, userId: string): Promise<number | null> {
  try {
    const response = await axios.post(`${config.aiServiceUrl}/match/score`, {
      project_id: projectId,
      user_id: userId,
    });
    return response.data.score ?? null;
  } catch {
    return null;
  }
}
