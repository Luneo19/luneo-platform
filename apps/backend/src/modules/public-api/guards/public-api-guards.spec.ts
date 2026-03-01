import { ExecutionContext, ForbiddenException, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiScopeGuard } from './api-scope.guard';
import { ApiPermissionGuard } from './api-permission.guard';
import { ApiQuotaGuard } from './api-quota.guard';

function mockExecutionContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('Public API Guards', () => {
  it('ApiScopeGuard bloque scope manquante', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue('messages:write'),
    } as unknown as Reflector;
    const guard = new ApiScopeGuard(reflector);

    const context = mockExecutionContext({
      publicApiAuth: { scopes: ['contacts:read'] },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('ApiPermissionGuard accepte wildcard namespace', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue('messages:write'),
    } as unknown as Reflector;
    const guard = new ApiPermissionGuard(reflector);
    const context = mockExecutionContext({
      publicApiAuth: { permissions: ['messages:*'] },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('ApiQuotaGuard retourne 429 si quota depasse', async () => {
    const redis = {
      client: {
        incr: jest.fn().mockResolvedValue(11),
        expire: jest.fn().mockResolvedValue(1),
      },
    } as any;
    const guard = new ApiQuotaGuard(redis);
    const context = mockExecutionContext({
      publicApiAuth: { keyId: 'k1', rateLimit: 10 },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
  });
});
