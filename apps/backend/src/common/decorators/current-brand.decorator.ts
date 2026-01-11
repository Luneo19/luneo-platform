/**
 * @fileoverview Decorator pour récupérer le brand depuis le CurrentUser
 * @module CurrentBrandDecorator
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUser } from '../types/user.types';

export const CurrentBrand = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUser;

    if (!user?.brand) {
      return null;
    }

    return {
      id: user.brand.id,
      name: user.brand.name,
      logo: user.brand.logo,
      website: user.brand.website,
    };
  },
);
