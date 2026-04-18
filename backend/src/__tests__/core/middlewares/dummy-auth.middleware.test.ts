import type { Request, Response, NextFunction } from 'express';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { dummyAuthMiddleware } from '../../../core/middlewares/dummy-auth.middleware.js';

describe('DummyAuthMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {};
  });

  it('should add a user_id to the request object', () => {
    dummyAuthMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockRequest.user_id).toBeDefined();
    expect(typeof mockRequest.user_id).toBe('string');
    expect(nextFunction).toHaveBeenCalled();
  });
});
