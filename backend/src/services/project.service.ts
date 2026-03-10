import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

// ============================================================
// Types
// ============================================================

interface CreateProjectInput {
  title: string;
  description: string;
  requiredSkills?: any;
  requiredResources?: any;
  offeredSkills?: any;
  offeredResources?: any;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  deadline?: string;
  maxCollaborators?: number;
  tags?: string[];
}

interface UpdateProjectInput extends Partial<CreateProjectInput> {
  status?: string;
}

// ============================================================
// Service Functions
// ============================================================

/**
 * Create a new project.
 */
export async function createProject(creatorId: string, input: CreateProjectInput) {
  return prisma.project.create({
    data: {
      creatorId,
      title: input.title,
      description: input.description,
      requiredSkills: input.requiredSkills || [],
      requiredResources: input.requiredResources || [],
      offeredSkills: input.offeredSkills || [],
      offeredResources: input.offeredResources || [],
      city: input.city,
      region: input.region,
      latitude: input.latitude,
      longitude: input.longitude,
      deadline: input.deadline ? new Date(input.deadline) : null,
      maxCollaborators: input.maxCollaborators || 5,
      tags: input.tags || [],
    },
    include: {
      creator: {
        select: { id: true, name: true, profileImageUrl: true, avgRating: true },
      },
    },
  });
}

/**
 * Get project by ID with full relations.
 */
export async function getProjectById(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      creator: {
        select: {
          id: true, name: true, profileImageUrl: true,
          bio: true, specialty: true, avgRating: true, totalReviews: true,
        },
      },
      matches: {
        include: {
          proposer: { select: { id: true, name: true, profileImageUrl: true } },
          receiver: { select: { id: true, name: true, profileImageUrl: true } },
        },
      },
    },
  });

  if (!project) {
    throw new AppError('Project not found.', 404);
  }

  return project;
}

/**
 * Update a project. Only the creator can modify it.
 */
export async function updateProject(
  projectId: string,
  userId: string,
  input: UpdateProjectInput
) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project) throw new AppError('Project not found.', 404);
  if (project.creatorId !== userId) throw new AppError('Not authorized to edit this project.', 403);

  return prisma.project.update({
    where: { id: projectId },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.description && { description: input.description }),
      ...(input.requiredSkills && { requiredSkills: input.requiredSkills }),
      ...(input.requiredResources && { requiredResources: input.requiredResources }),
      ...(input.offeredSkills && { offeredSkills: input.offeredSkills }),
      ...(input.offeredResources && { offeredResources: input.offeredResources }),
      ...(input.status && { status: input.status }),
      ...(input.city && { city: input.city }),
      ...(input.region && { region: input.region }),
      ...(input.latitude !== undefined && { latitude: input.latitude }),
      ...(input.longitude !== undefined && { longitude: input.longitude }),
      ...(input.deadline && { deadline: new Date(input.deadline) }),
      ...(input.maxCollaborators && { maxCollaborators: input.maxCollaborators }),
      ...(input.tags && { tags: input.tags }),
    },
  });
}

/**
 * Delete a project. Only the creator can delete it.
 */
export async function deleteProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project) throw new AppError('Project not found.', 404);
  if (project.creatorId !== userId) throw new AppError('Not authorized to delete this project.', 403);

  return prisma.project.delete({ where: { id: projectId } });
}

/**
 * Search and filter projects with pagination.
 */
export async function searchProjects(params: {
  keyword?: string;
  status?: string;
  tags?: string[];
  city?: string;
  page?: number;
  limit?: number;
}) {
  const { keyword, status, tags, city, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: 'insensitive' } },
      { description: { contains: keyword, mode: 'insensitive' } },
    ];
  }

  if (status) where.status = status;
  if (city) where.city = { contains: city, mode: 'insensitive' };

  // Tag filtering with JSONB contains
  if (tags && tags.length > 0) {
    where.tags = { array_contains: tags };
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, profileImageUrl: true, avgRating: true },
        },
        _count: { select: { matches: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.project.count({ where }),
  ]);

  return {
    projects,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
