import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '@/libs/prisma/prisma.service';

@Injectable()
export class SessionTrackingInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const url = request.url ?? '';
    const params = request.params ?? {};

    if (!url.includes('sessions')) {
      return next.handle();
    }

    const sessionId = params['sessionId'];
    if (!sessionId) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: () => {
          Promise.resolve()
            .then(() =>
              this.prisma.configurator3DSession.update({
                where: { sessionId },
                data: { lastActivityAt: new Date() },
              }),
            )
            .catch(() => {
              /* silent - do not fail the request */
            });
        },
      }),
    );
  }
}
