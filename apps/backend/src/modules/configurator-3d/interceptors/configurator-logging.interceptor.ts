import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrentUser } from '@/common/types/user.types';
import { Prisma } from '@prisma/client';

@Injectable()
export class ConfiguratorLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ConfiguratorLoggingInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();
    const { method, url, params, body } = request;
    const user = request.user as CurrentUser | undefined;
    const userId = user?.id ?? 'anonymous';
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers?.['user-agent'] ?? undefined;

    const action = this.buildAction(method, url);
    const { entityType, entityId, ...rest } = this.extractEntityInfo(
      url,
      params,
      body,
    );
    let configurationId = rest.configurationId;

    if (!configurationId && entityType === 'session' && params['sessionId']) {
      configurationId = await this.resolveConfigurationIdFromSession(
        params['sessionId'],
      );
    }

    if (['PUT', 'PATCH', 'DELETE'].includes(method)) {
      if (!configurationId) {
        return next.handle();
      }
      return this.interceptWithPreviousValue(
        next,
        method,
        configurationId,
        entityType,
        entityId,
        userId,
        ipAddress,
        userAgent,
        action,
        params,
        body,
      );
    }

    if (method === 'POST') {
      return next.handle().pipe(
        tap({
          next: (response) => {
            const res = response as { id?: string; configurationId?: string };
            const resolvedConfigId = configurationId ?? res?.configurationId ?? res?.id;
            if (!resolvedConfigId) return;
            Promise.resolve()
              .then(() =>
                this.logAudit({
                  configurationId: resolvedConfigId,
                  userId,
                  action,
                  entityType,
                  entityId: entityId ?? res?.id,
                  previousValue: null,
                  newValue: this.sanitizeForJson(response),
                  ipAddress,
                  userAgent,
                }),
              )
              .catch((err) =>
                this.logger.warn('Audit log failed (POST)', err),
              );
          },
        }),
      );
    }

    return next.handle();
  }

  private async resolveConfigurationIdFromSession(
    sessionId: string,
  ): Promise<string | undefined> {
    try {
      const session = await this.prisma.configurator3DSession.findUnique({
        where: { sessionId },
        select: { configurationId: true },
      });
      return session?.configurationId;
    } catch {
      return undefined;
    }
  }

  private interceptWithPreviousValue(
    next: CallHandler,
    method: string,
    configurationId: string,
    entityType: string,
    entityId: string | undefined,
    userId: string,
    ipAddress: string | undefined,
    userAgent: string | undefined,
    action: string,
    params: Record<string, string>,
    _body: Record<string, unknown>,
  ): Observable<unknown> {
    const fetchPrevious = this.fetchPreviousValue(
      method,
      configurationId,
      entityType,
      entityId,
      params,
    );

    return new Observable((observer) => {
      fetchPrevious
        .then((previousValue) => {
          next.handle().subscribe({
            next: (response) => {
              const newValue =
                method === 'DELETE' ? null : this.sanitizeForJson(response);
              Promise.resolve()
                .then(() =>
                  this.logAudit({
                    configurationId,
                    userId,
                    action,
                    entityType,
                    entityId,
                    previousValue,
                    newValue,
                    ipAddress,
                    userAgent,
                  }),
                )
                .catch((err) =>
                  this.logger.warn('Audit log failed', err),
                );
              observer.next(response);
              observer.complete();
            },
            error: (err) => {
              observer.error(err);
            },
          });
        })
        .catch((err) => {
          this.logger.warn('Failed to fetch previous value for audit', err);
          next.handle().subscribe({
            next: (v) => observer.next(v),
            error: (e) => observer.error(e),
            complete: () => observer.complete(),
          });
        });
    });
  }

  private async fetchPreviousValue(
    method: string,
    configurationId: string,
    entityType: string,
    entityId: string | undefined,
    params: Record<string, string>,
  ): Promise<Prisma.InputJsonValue | null> {
    try {
      if (entityType === 'configuration' && params['id']) {
        const config = await this.prisma.configurator3DConfiguration.findUnique({
          where: { id: params['id'] },
        });
        return config ? (this.sanitizeForJson(config) as Prisma.InputJsonValue) : null;
      }

      if (entityType === 'option' && params['optionId']) {
        const option = await this.prisma.configurator3DOption.findUnique({
          where: { id: params['optionId'] },
        });
        return option ? (this.sanitizeForJson(option) as Prisma.InputJsonValue) : null;
      }

      if (entityType === 'session' && params['sessionId']) {
        const session = await this.prisma.configurator3DSession.findUnique({
          where: { sessionId: params['sessionId'] },
        });
        return session ? (this.sanitizeForJson(session) as Prisma.InputJsonValue) : null;
      }

      return null;
    } catch {
      return null;
    }
  }

  private async logAudit(data: {
    configurationId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: string | undefined;
    previousValue: Prisma.InputJsonValue | null;
    newValue: Prisma.InputJsonValue | null;
    ipAddress: string | undefined;
    userAgent: string | undefined;
  }): Promise<void> {
    try {
      await this.prisma.configurator3DAuditLog.create({
        data: {
          configurationId: data.configurationId,
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId ?? null,
          previousValue: data.previousValue === null ? Prisma.JsonNull : data.previousValue,
          newValue: data.newValue === null ? Prisma.JsonNull : data.newValue,
          ipAddress: data.ipAddress ?? null,
          userAgent: data.userAgent ?? null,
        },
      });
    } catch (err) {
      this.logger.warn('Configurator3D audit log create failed', err);
    }
  }

  private buildAction(method: string, url: string): string {
    const methodMap: Record<string, string> = {
      GET: 'read',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    };
    const base = methodMap[method] ?? method.toLowerCase();
    if (url.includes('/options')) return `${base}_option`;
    if (url.includes('/sessions')) return `${base}_session`;
    return `${base}_configuration`;
  }

  private extractEntityInfo(
    url: string,
    params: Record<string, string>,
    body: Record<string, unknown>,
  ): { entityType: string; entityId: string | undefined; configurationId: string | undefined } {
    if (url.includes('/sessions/')) {
      const sessionId = params['sessionId'];
      const configurationId = (body as { configurationId?: string })?.configurationId;
      return {
        entityType: 'session',
        entityId: sessionId,
        configurationId: configurationId ?? undefined,
      };
    }

    if (url.includes('/options/')) {
      const configId = params['id'];
      const optionId = params['optionId'];
      return {
        entityType: 'option',
        entityId: optionId,
        configurationId: configId,
      };
    }

    if (url.includes('/configurations/')) {
      const configId = params['id'];
      return {
        entityType: 'configuration',
        entityId: configId,
        configurationId: configId,
      };
    }

    if (url.includes('/sessions') && body && typeof body === 'object') {
      const configurationId = (body as { configurationId?: string })?.configurationId;
      return {
        entityType: 'session',
        entityId: undefined,
        configurationId: configurationId as string | undefined,
      };
    }

    if (url.includes('/configurations') && body && typeof body === 'object') {
      const configurationId = (body as { projectId?: string })?.projectId
        ? undefined
        : params['id'];
      return {
        entityType: 'configuration',
        entityId: params['id'],
        configurationId: configurationId as string | undefined,
      };
    }

    return {
      entityType: 'configuration',
      entityId: params['id'],
      configurationId: params['id'],
    };
  }

  private getClientIp(request: { ip?: string; headers?: Record<string, string> }): string | undefined {
    const forwarded = request.headers?.['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0]?.trim();
    }
    return request.ip;
  }

  private sanitizeForJson(value: unknown): Prisma.InputJsonValue {
    if (value === null || value === undefined) {
      return Prisma.JsonNull as unknown as Prisma.InputJsonValue;
    }
    if (typeof value === 'object' && !(value instanceof Date)) {
      try {
        return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
      } catch {
        return { _raw: String(value) } as Prisma.InputJsonValue;
      }
    }
    return value as Prisma.InputJsonValue;
  }
}
