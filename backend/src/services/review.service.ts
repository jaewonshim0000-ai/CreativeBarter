import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

/**
 * Create a review for a user after a project collaboration.
 * Validates that both users were involved in the project.
 */
export async function createReview(
  reviewerId: string,
  reviewedUserId: string,
  projectId: string,
  rating: number,
  content?: string
) {
  // Prevent self-review
  if (reviewerId === reviewedUserId) {
    throw new AppError('Cannot review yourself.', 400);
  }

  // Validate rating range
  if (rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5.', 400);
  }

  // Verify the project exists and is completed
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError('Project not found.', 404);
  if (project.status !== 'completed') {
    throw new AppError('Reviews can only be left for completed projects.', 400);
  }

  // Check that a match exists between these users for this project
  const match = await prisma.match.findFirst({
    where: {
      projectId,
      status: 'accepted',
      OR: [
        { proposerId: reviewerId, receiverId: reviewedUserId },
        { proposerId: reviewedUserId, receiverId: reviewerId },
      ],
    },
  });

  if (!match && project.creatorId !== reviewerId && project.creatorId !== reviewedUserId) {
    throw new AppError('You can only review users you collaborated with.', 403);
  }

  const review = await prisma.review.create({
    data: { reviewerId, reviewedUserId, projectId, rating, content },
    include: {
      reviewer: { select: { id: true, name: true, profileImageUrl: true } },
      project: { select: { id: true, title: true } },
    },
  });

  // Update the reviewed user's average rating
  const aggregation = await prisma.review.aggregate({
    where: { reviewedUserId },
    _avg: { rating: true },
    _count: true,
  });

  await prisma.user.update({
    where: { id: reviewedUserId },
    data: {
      avgRating: aggregation._avg.rating ?? 0,
      totalReviews: aggregation._count,
    },
  });

  return review;
}

/**
 * Get all reviews for a specific user.
 */
export async function getUserReviews(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { reviewedUserId: userId },
      include: {
        reviewer: { select: { id: true, name: true, profileImageUrl: true } },
        project: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: { reviewedUserId: userId } }),
  ]);

  return {
    reviews,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
