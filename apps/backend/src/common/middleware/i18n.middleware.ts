import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { I18nService } from '@/libs/i18n/i18n.service';
import { TimezoneService } from '@/libs/timezone/timezone.service';

@Injectable()
export class I18nMiddleware implements NestMiddleware {
  constructor(
    private readonly i18nService: I18nService,
    private readonly timezoneService: TimezoneService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Detect locale from Accept-Language header
    const acceptLanguage = req.headers['accept-language'];
    const locale = this.i18nService.detectLocale(acceptLanguage);
    
    // Detect timezone from header or default
    const timezoneHeader = req.headers['x-timezone'] as string;
    const timezone = this.timezoneService.getUserTimezone(timezoneHeader);

    // Attach to request for use in controllers/services
    (req as Request & { locale: string; timezone: string }).locale = locale;
    (req as Request & { locale: string; timezone: string }).timezone = timezone;

    // Set response headers
    res.setHeader('Content-Language', locale);
    res.setHeader('X-Timezone', timezone);

    next();
  }
}

