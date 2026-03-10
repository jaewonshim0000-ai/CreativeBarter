import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as messageService from '../services/message.service';

/** POST /api/messages */
export async function send(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { receiverId, content, projectId } = req.body;
    const message = await messageService.sendMessage(req.userId!, receiverId, content, projectId);
    res.status(201).json(message);
  } catch (error) { next(error); }
}

/** GET /api/messages/conversations */
export async function getConversations(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const conversations = await messageService.getUserConversations(req.userId!);
    res.json(conversations);
  } catch (error) { next(error); }
}

/** GET /api/messages/:userId */
export async function getConversation(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, projectId } = req.query;
    const result = await messageService.getConversation(
      req.userId!,
      req.params.userId,
      projectId as string,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 50
    );
    res.json(result);
  } catch (error) { next(error); }
}

/** GET /api/messages/unread/count */
export async function getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const count = await messageService.getUnreadCount(req.userId!);
    res.json({ unreadCount: count });
  } catch (error) { next(error); }
}
