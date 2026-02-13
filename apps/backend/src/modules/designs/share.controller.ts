import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '@/common/decorators/public.decorator';
import { DesignsService } from './designs.service';

/**
 * Public share resolution: resolve a share token and return the shared resource.
 * No authentication required.
 */
@ApiTags('share')
@Controller('share')
export class ShareController {
  constructor(private readonly designsService: DesignsService) {}

  @Get(':token')
  /** @Public: share links accessed via token only (no auth) */
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Resolve a public share token and return the shared resource' })
  @ApiParam({ name: 'token', description: 'Share token' })
  @ApiResponse({ status: 200, description: 'Shared design/resource data' })
  @ApiResponse({ status: 404, description: 'Share not found or expired' })
  async resolve(@Param('token') token: string) {
    const resource = await this.designsService.getShared(token);
    return { share: resource };
  }
}
