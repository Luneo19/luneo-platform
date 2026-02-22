/**
 * @CurrentOrg / @CurrentBrand decorator
 * Extracts the organization from the current user.
 * Keeps backward compat name "CurrentBrand" while returning org data.
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUser } from '../types/user.types';

export const CurrentBrand = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUser;

    if (!user?.organization) {
      return null;
    }

    return {
      id: user.organization.id,
      name: user.organization.name,
      slug: user.organization.slug,
      logo: user.organization.logo,
    };
  },
);

export const CurrentOrg = CurrentBrand;
