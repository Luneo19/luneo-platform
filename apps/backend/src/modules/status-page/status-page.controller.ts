import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { SkipRateLimit } from '@/libs/rate-limit/rate-limit.decorator';
import { StatusPageService } from './status-page.service';

@ApiTags('status-page')
@Controller('status')
@SkipRateLimit()
@Public()
export class StatusPageController {
  constructor(private readonly statusPageService: StatusPageService) {}

  @Get('public')
  @ApiOperation({ summary: 'Etat public des services Luneo (status page)' })
  async publicStatus() {
    return this.statusPageService.getPublicStatus();
  }
}
