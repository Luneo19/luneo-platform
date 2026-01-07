import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUser } from '../types/user.types';

/**
 * Decorator to extract current user from request
 * Usage: @User() user: CurrentUser
 */
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as CurrentUser;
  },
);

