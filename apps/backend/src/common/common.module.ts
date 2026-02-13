import { Module, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

import { PrismaModule } from '@/libs/prisma/prisma.module';
import { RolesGuard } from './guards/roles.guard';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CsrfGuard } from './guards/csrf.guard';
import { BrandScopedGuard } from './guards/brand-scoped.guard';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { AppErrorFilter } from './errors/app-error.filter';
import { ValidationPipe } from './utils/validation.pipe';
import { RateLimitGuard } from '@/libs/rate-limit/rate-limit.guard';
import { RateLimitModule } from '@/libs/rate-limit/rate-limit.module';
import { I18nModule } from '@/libs/i18n/i18n.module';
import { TimezoneModule } from '@/libs/timezone/timezone.module';
import { I18nMiddleware } from '@/common/middleware/i18n.middleware';
import { XssSanitizeMiddleware } from '@/common/middleware/xss-sanitize.middleware';

@Global()
@Module({
  imports: [
    PrismaModule,
    RateLimitModule,
    I18nModule,
    TimezoneModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    {
      provide: APP_GUARD,
      useClass: BrandScopedGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AppErrorFilter,
    },
    ValidationPipe,
    I18nMiddleware,
    XssSanitizeMiddleware,
  ],
  exports: [ValidationPipe, I18nModule, TimezoneModule],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(XssSanitizeMiddleware, I18nMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
