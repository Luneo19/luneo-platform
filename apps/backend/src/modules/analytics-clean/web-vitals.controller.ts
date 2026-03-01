import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { PrismaService } from '@/libs/prisma/prisma.service';

@ApiTags('Analytics')
@Controller('analytics')
@Public()
export class WebVitalsController {
  private readonly logger = new Logger(WebVitalsController.name);
  constructor(private readonly prisma: PrismaService) {}

  @Post('web-vitals')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Track Web Vitals metrics' })
  async trackWebVitals(@Body() body: Record<string, unknown>) {
    const name =
      typeof body?.name === 'string' && body.name.trim()
        ? body.name.trim()
        : 'unknown';
    const value = typeof body?.value === 'number' ? body.value : 0;

    await this.prisma.webVital.create({
      data: {
        name,
        value,
        rating: typeof body?.rating === 'string' ? body.rating : undefined,
        delta: typeof body?.delta === 'number' ? body.delta : undefined,
        page: typeof body?.page === 'string' ? body.page : undefined,
        userAgent:
          typeof body?.userAgent === 'string' ? body.userAgent : undefined,
        sessionId:
          typeof body?.sessionId === 'string' ? body.sessionId : undefined,
        connection:
          typeof body?.connection === 'string' ? body.connection : undefined,
      },
    });

    this.logger.debug(`Web Vital stored: ${name} = ${value}`);
    return { success: true, name, value };
  }
}
