import axios from 'axios';
import prisma from '../utils/prisma';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

// ============================================================
// Service Functions
// ============================================================

/**
 * Create a match proposal (one user proposes to collaborate on a project).
 * Fetches real user + project data and sends to AI for scoring.
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

  // Get AI match score using real data
  let matchScore: number | null = null;
  try {
    const proposer = await prisma.user.findUnique({
      where: { id: proposerId },
      include: { skills: { include: { skill: true } } },
    });

    if (proposer) {
      const userSkills = proposer.skills.map((us: any) => us.skill.name);
      const requiredSkills = (project.requiredSkills as any[] || []).map((s: any) => s.name || s);

      matchScore = await getAIMatchScore({
        projectDescription: project.description,
        projectRequiredSkills: requiredSkills,
        userBio: proposer.bio || '',
        userSkills,
      });
    }
  } catch (err) {
    console.warn('[Match] AI scoring failed, proceeding without score:', err);
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
 * Fetches the project data + all users with relevant skills,
 * then sends them to the AI service for ranking.
 */
export async function getProjectRecommendations(projectId: string) {
  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return { recommendations: [], source: 'error' };

    const requiredSkills = (project.requiredSkills as any[] || []).map((s: any) => s.name || s);

    // Find users who have at least one of the required skills
    const candidates = await prisma.user.findMany({
      where: {
        id: { not: project.creatorId }, // Exclude project creator
      },
      include: {
        skills: { include: { skill: true } },
      },
      take: 50,
    });

    const candidateProfiles = candidates.map((u: any) => ({
      user_id: u.id,
      name: u.name,
      bio: u.bio || '',
      skills: u.skills.map((us: any) => us.skill.name),
      specialty: u.specialty,
      city: u.city,
      avg_rating: u.avgRating,
    }));

    const response = await axios.post(`${config.aiServiceUrl}/match/recommend`, {
      project_id: projectId,
      project_description: project.description,
      project_required_skills: requiredSkills,
      candidate_profiles: candidateProfiles,
    });

    return response.data;
  } catch (err) {
    console.warn('[Match] AI recommendation service unavailable:', err);
    return { recommendations: [], source: 'fallback' };
  }
}

/**
 * Analyze text (bio, project description) using the AI service.
 * Returns extracted keywords and categories.
 */
export async function analyzeText(text: string) {
  try {
    const response = await axios.post(`${config.aiServiceUrl}/analyze-text`, {
      text,
      max_keywords: 10,
    });
    return response.data;
  } catch (err) {
    console.warn('[AI] Text analysis unavailable:', err);
    return null;
  }
}

/**
 * Request AI match score using actual user and project data.
 */
async function getAIMatchScore(data: {
  projectDescription: string;
  projectRequiredSkills: string[];
  userBio: string;
  userSkills: string[];
}): Promise<number | null> {
  try {
    const response = await axios.post(`${config.aiServiceUrl}/match/score`, {
      project_id: 'scoring',
      user_id: 'scoring',
      project_description: data.projectDescription,
      project_required_skills: data.projectRequiredSkills,
      user_bio: data.userBio,
      user_skills: data.userSkills,
    });
    return response.data.score ?? null;
  } catch {
    return null;
  }
}
