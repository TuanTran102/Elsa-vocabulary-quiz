import type { Request, Response, NextFunction } from 'express';

export const dummyAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Simulate an authenticated user by injecting a dummy UUID
  // In a real app, this would be extracted from a JWT token
  req.user_id = 'user-' + Math.random().toString(36).substr(2, 9);
  next();
};
