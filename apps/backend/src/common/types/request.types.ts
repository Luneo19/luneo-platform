/**
 * Request types - Express request with optional or required user
 * Use instead of req: any in controllers
 */

import { Request as ExpressRequest } from 'express';
import { CurrentUser } from './user.types';

/** Request with optional user (e.g. public or authenticated routes) */
export type RequestWithOptionalUser = ExpressRequest & { user?: CurrentUser };

/** Request with required user (use after JwtAuthGuard) */
export type RequestWithUser = ExpressRequest & { user: CurrentUser };
