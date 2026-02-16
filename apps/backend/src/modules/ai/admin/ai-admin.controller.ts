import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AIAdminService } from './ai-admin.service';

@ApiTags('Admin - AI Studio')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/ai')
export class AIAdminController {
  constructor(private readonly adminService: AIAdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get AI Dashboard KPIs' })
  async getDashboard() {
    return this.adminService.getDashboardKPIs();
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get provider stats' })
  async getProviders() {
    return this.adminService.getProviderStats();
  }

  @Get('costs')
  @ApiOperation({ summary: 'Get cost details' })
  async getCosts(
    @Query('provider') provider?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminService.getCostDetails({
      provider,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('users/:userId/usage')
  @ApiOperation({ summary: 'Get user AI usage details' })
  async getUserUsage(@Param('userId') userId: string) {
    return this.adminService.getUserUsage(userId);
  }
}
