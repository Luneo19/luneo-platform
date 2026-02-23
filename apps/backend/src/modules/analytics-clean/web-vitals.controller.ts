import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Analytics')
@Controller('analytics')
@Public()
export class WebVitalsController {
  private readonly logger = new Logger(WebVitalsController.name);

  @Post('web-vitals')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Track Web Vitals metrics' })
  async trackWebVitals(@Body() body: Record<string, unknown>) {
    this.logger.debug(`Web Vital: ${body?.name} = ${body?.value}`);
    return { success: true };
  }
}
