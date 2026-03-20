import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

/**
 * Create a review for a user you've bartered with.
 * Validates that both users have an accepted match together.
 */
export async function createReview(
  reviewerId: string,
  reviewedUserId: string,
  projectId: string,
  rating: number,
  content?: string,
  tags?: string[]
) {
  if (reviewerId === reviewedUserId) {
    throw new AppError('Cannot review yourself.', 400);
  }

  if (rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5.', 400);
  }

  // Verify the project exists
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError('Project not found.', 404);

  // Check that an accepted match exists between these users for this project
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

  // Also allow if reviewer is the project creator and the other person has an accepted match
  const isCreatorReview = project.creatorId === reviewerId || project.creatorId === reviewedUserId;

  if (!match && !isCreatorReview) {
    throw new AppError('You can only review users you have an accepted barter with.', 403);
  }

  // Check for duplicate review
  const existing = await prisma.review.findFirst({
    where: { reviewerId, reviewedUserId, projectId },
  });
  if (existing) {
    throw new AppError('You have already reviewed this user for this project.', 409);
  }

  const review = await prisma.review.create({
    data: { reviewerId, reviewedUserId, projectId, rating, content },
    include: {
      reviewer: { select: { id: true, name: true, profileImageUrl: true } },
      reviewedUser: { select: { id: true, name: true } },
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
 * Get all reviews for a specific user with pagination.
 */
export async function getUserReviews(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const [reviews, total, avgRating] = await Promise.all([
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
    prisma.review.aggregate({
      where: { reviewedUserId: userId },
      _avg: { rating: true },
    }),
  ]);

  // Rating distribution (1-5 stars)
  const distribution = await prisma.review.groupBy({
    by: ['rating'],
    where: { reviewedUserId: userId },
    _count: true,
  });

  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  distribution.forEach((d) => {
    ratingDistribution[d.rating] = d._count;
  });

  return {
    reviews,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    avgRating: avgRating._avg.rating ?? 0,
    ratingDistribution,
  };
}

/**
 * Get all reviews written BY a specific user.
 */
export async function getReviewsByUser(userId: string) {
  return prisma.review.findMany({
    where: { reviewerId: userId },
    include: {
      reviewedUser: { select: { id: true, name: true, profileImageUrl: true } },
      project: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Check which users the reviewer can review (accepted matches not yet reviewed).
 */
export async function getReviewableMatches(userId: string) {
  // Get all accepted matches involving this user
  const matches = await prisma.match.findMany({
    where: {
      status: 'accepted',
      OR: [{ proposerId: userId }, { receiverId: userId }],
    },
    include: {
      project: { select: { id: true, title: true } },
      proposer: { select: { id: true, name: true, profileImageUrl: true } },
      receiver: { select: { id: true, name: true, profileImageUrl: true } },
    },
  });

  // Get all reviews already written by this user
  const existingReviews = await prisma.review.findMany({
    where: { reviewerId: userId },
    select: { reviewedUserId: true, projectId: true },
  });

  const reviewedSet = new Set(
    existingReviews.map((r) => `${r.reviewedUserId}:${r.projectId}`)
  );

  // Filter to only show un-reviewed partners
  const reviewable = matches
    .map((match) => {
      const isProposer = match.proposerId === userId;
      const otherUser = isProposer ? match.receiver : match.proposer;
      const otherUserId = isProposer ? match.receiverId : match.proposerId;
      const alreadyReviewed = reviewedSet.has(`${otherUserId}:${match.projectId}`);

      return {
        matchId: match.id,
        projectId: match.projectId,
        projectTitle: match.project?.title || 'Untitled',
        otherUserId,
        otherUserName: otherUser?.name || 'Unknown',
        otherUserImage: otherUser?.profileImageUrl,
        alreadyReviewed,
      };
    });

  return reviewable;
}
