import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; brandId?: string | null; role?: string; [key: string]: unknown };
      brandId?: string;
      apiKey?: { id: string; brandId: string; [key: string]: unknown };
    }
  }
}

export {};
