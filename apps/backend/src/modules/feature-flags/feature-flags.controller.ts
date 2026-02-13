import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RequestWithUser } from '@/common/types/user.types';
import { FeatureFlagsService } from './feature-flags.service';

@ApiTags('feature-flags')
@Controller('feature-flags')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @ApiOperation({ summary: 'Get feature flags for the authenticated brand' })
  @ApiResponse({ status: 200, description: 'Map of flag key to enabled' })
  async getFlags(@Request() req: RequestWithUser) {
    const brandId = req.user?.brandId ?? null;
    const flags = await this.featureFlagsService.getFlagsForBrand(brandId);
    return {
      success: true,
      flags,
      updatedAt: new Date().toISOString(),
    };
  }
}
