import { BadRequestException, Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import { CurrentUser } from '@/common/types/user.types';
import { BrandsService } from './brands.service';
import { BillingService } from '@/modules/billing/billing.service';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(
    private readonly brandsService: BrandsService,
    private readonly billingService: BillingService,
  ) {}

  @Get('settings')
  @ApiOperation({ summary: 'Alias organizations -> brand settings for authenticated user' })
  async getSettings(@Request() req: ExpressRequest) {
    const user = req.user as CurrentUser | undefined;
    if (!user?.organizationId) {
      throw new BadRequestException('No organization associated with this user');
    }
    return this.brandsService.findOne(user.organizationId, user);
  }

  @Get(':id/usage')
  @ApiOperation({ summary: 'Usage/cost overview for current organization member' })
  async getOrganizationUsage(
    @Request() req: ExpressRequest,
    @Param('id') organizationId: string,
  ) {
    const user = req.user as CurrentUser | undefined;
    if (!user?.id) {
      throw new BadRequestException('Authenticated user is required');
    }
    return {
      data: await this.billingService.getOrganizationUsageForUser(user.id, organizationId),
    };
  }
}
