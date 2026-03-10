import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as reviewService from '../services/review.service';

/** POST /api/reviews */
export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { reviewedUserId, projectId, rating, content } = req.body;
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
