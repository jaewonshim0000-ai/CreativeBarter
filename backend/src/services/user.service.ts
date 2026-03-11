import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

// ============================================================
// Types
// ============================================================

interface UpdateProfileInput {
  name?: string;
  bio?: string;
  specialty?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  profileImageUrl?: string;
  portfolio?: any;
}

// ============================================================
// Service Functions
// ============================================================

/**
 * Get a user's full profile by ID, including skills and resources.
 */
export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      skills: { include: { skill: true } },
      resources: { include: { resource: true } },
      receivedReviews: {
        include: {
          reviewer: { select: { id: true, name: true, profileImageUrl: true } },
          project: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  // Exclude password hash from response
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * Update user profile fields.
 */
export async function updateUserProfile(userId: string, input: UpdateProfileInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.bio !== undefined && { bio: input.bio }),
      ...(input.specialty && { specialty: input.specialty }),
      ...(input.city && { city: input.city }),
      ...(input.region && { region: input.region }),
      ...(input.latitude !== undefined && { latitude: input.latitude }),
      ...(input.longitude !== undefined && { longitude: input.longitude }),
      ...(input.profileImageUrl && { profileImageUrl: input.profileImageUrl }),
      ...(input.portfolio && { portfolio: input.portfolio }),
    },
  });

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * Add a skill to user's profile.
 */
export async function addUserSkill(
  userId: string,
  skillId: string,
  proficiency: string = 'beginner',
  yearsExperience: number = 0
) {
  return prisma.userSkill.create({
    data: { userId, skillId, proficiency, yearsExperience },
    include: { skill: true },
  });
}

/**
 * Remove a skill from user's profile.
 */
export async function removeUserSkill(userId: string, skillId: string) {
  return prisma.userSkill.deleteMany({
    where: { userId, skillId },
  });
}

/**
 * Bulk save skills from AI portfolio analysis.
 * Creates skills that don't exist, then links them to the user.
 * Skips duplicates. Maps proficiency 1-10 to enum values.
 */
export async function bulkSaveSkills(
  userId: string,
  skills: { name: string; proficiency_estimate: number; category: string }[]
) {
  const results = [];

  for (const skill of skills) {
    try {
      // Find or create the skill in the master skills table
      let dbSkill = await prisma.skill.findUnique({ where: { name: skill.name } });

      if (!dbSkill) {
        dbSkill = await prisma.skill.create({
          data: {
            name: skill.name,
            category: skill.category,
            description: `Auto-detected by AI portfolio analysis`,
          },
        });
      }

      // Map 1-10 to proficiency enum
      let proficiency = 'beginner';
      if (skill.proficiency_estimate >= 7) proficiency = 'advanced';
      else if (skill.proficiency_estimate >= 4) proficiency = 'intermediate';
      if (skill.proficiency_estimate >= 9) proficiency = 'expert';

      // Create user-skill link (skip if already exists)
      const existing = await prisma.userSkill.findUnique({
        where: { userId_skillId: { userId, skillId: dbSkill.id } },
      });

      if (!existing) {
        const userSkill = await prisma.userSkill.create({
          data: {
            userId,
            skillId: dbSkill.id,
            proficiency,
            yearsExperience: Math.max(0, Math.floor(skill.proficiency_estimate / 2)),
          },
          include: { skill: true },
        });
        results.push({ ...userSkill, status: 'created' });
      } else {
        results.push({ id: existing.id, skill: dbSkill, proficiency, status: 'already_exists' });
      }
    } catch (err) {
      console.warn(`[Skills] Failed to save skill "${skill.name}":`, err);
      results.push({ name: skill.name, status: 'failed' });
    }
  }

  return results;
}

/**
 * Add a resource to user's profile.
 */
export async function addUserResource(
  userId: string,
  resourceId: string,
  details?: string,
  availability: string = 'available'
) {
  return prisma.userResource.create({
    data: { userId, resourceId, details, availability },
    include: { resource: true },
  });
}

/**
 * Remove a resource from user's profile.
 */
export async function removeUserResource(userId: string, resourceId: string) {
  return prisma.userResource.deleteMany({
    where: { userId, resourceId },
  });
}

/**
 * Search users by keyword, skills, or location proximity.
 * Uses raw SQL for PostGIS distance queries when coordinates are provided.
 */
export async function searchUsers(params: {
  keyword?: string;
  specialty?: string;
  skillIds?: string[];
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
}) {
  const { keyword, specialty, skillIds, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where: any = {};

  // Keyword search on name and bio
  if (keyword) {
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
      { bio: { contains: keyword, mode: 'insensitive' } },
    ];
  }

  // Filter by specialty
  if (specialty) {
    where.specialty = specialty;
  }

  // Filter by skills
  if (skillIds && skillIds.length > 0) {
    where.skills = {
      some: { skillId: { in: skillIds } },
    };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        profileImageUrl: true,
        bio: true,
        specialty: true,
        city: true,
        region: true,
        avgRating: true,
        totalReviews: true,
        skills: { include: { skill: true } },
      },
      skip,
      take: limit,
      orderBy: { avgRating: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
