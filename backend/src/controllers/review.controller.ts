import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as reviewService from '../services/review.service';

/** POST /api/reviews */
export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { reviewedUserId, projectId, rating, content } = req.body;
    if (!reviewedUserId || !projectId || !rating) {
      res.status(400).json({ error: 'reviewedUserId, projectId, and rating are required.' });
      return;
    }
    const review = await reviewService.createReview(
      req.userId!, reviewedUserId, projectId, rating, content
    );
    res.status(201).json(review);
  } catch (error) { next(error); }
}

/** GET /api/reviews/user/:userId */
export async function getUserReviews(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query;
    const result = await reviewService.getUserReviews(
      req.params.userId,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 20
    );
    res.json(result);
  } catch (error) { next(error); }
}

/** GET /api/reviews/by-me */
export async function getMyReviews(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const reviews = await reviewService.getReviewsByUser(req.userId!);
    res.json(reviews);
  } catch (error) { next(error); }
}

/** GET /api/reviews/reviewable */
export async function getReviewableMatches(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const reviewable = await reviewService.getReviewableMatches(req.userId!);
    res.json(reviewable);
  } catch (error) { next(error); }
}
