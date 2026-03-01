import { XssSanitizeMiddleware } from './xss-sanitize.middleware';
import { NextFunction, Request, Response } from 'express';

type MiddlewareRequest = Pick<Request, 'method' | 'url' | 'path' | 'body'>;
type MiddlewareResponse = Pick<Response, 'status' | 'json'>;

describe('XssSanitizeMiddleware', () => {
  const middleware = new XssSanitizeMiddleware();

  it('sanitize un body standard', () => {
    const req: MiddlewareRequest = {
      method: 'POST',
      url: '/api/v1/contacts',
      path: '/api/v1/contacts',
      body: {
        message: '<script>alert(1)</script>hello',
      },
    };
    const res: MiddlewareResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next: NextFunction = jest.fn();

    middleware.use(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(req.body.message).toBe('hello');
  });

  it('bypass sanitize pour webhook stripe signe', () => {
    const req: MiddlewareRequest = {
      method: 'POST',
      url: '/billing/webhook',
      path: '/billing/webhook',
      body: {
        message: '<script>alert(1)</script>keep-raw',
      },
    };
    const res: MiddlewareResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next: NextFunction = jest.fn();

    middleware.use(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(req.body.message).toContain('<script>');
  });

  it('rejette les path traversal', () => {
    const req: MiddlewareRequest = {
      method: 'POST',
      url: '/api/../../etc/passwd',
      path: '/api/../../etc/passwd',
      body: {},
    };
    const json = jest.fn();
    const res: MiddlewareResponse = {
      status: jest.fn().mockReturnValue({ json }),
      json,
    };
    const next: NextFunction = jest.fn();

    middleware.use(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ message: 'Invalid request path' });
  });
});
