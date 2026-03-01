import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '@/common/types/user.types';
import { EnterpriseService } from './enterprise.service';

@ApiTags('enterprise')
@Controller('enterprise')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EnterpriseController {
  constructor(private readonly enterpriseService: EnterpriseService) {}

  @Get('white-label')
  @ApiOperation({ summary: 'Lire la configuration white-label' })
  async getWhiteLabel(@CurrentUser() user: CurrentUserType) {
    return this.enterpriseService.getWhiteLabel(user);
  }

  @Post('white-label')
  @ApiOperation({ summary: 'Mettre a jour la configuration white-label' })
  async upsertWhiteLabel(
    @CurrentUser() user: CurrentUserType,
    @Body()
    body: {
      customDomain?: string;
      customLogoUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
      emailSenderDomain?: string;
      hidePoweredBy?: boolean;
      customFavicon?: string;
    },
  ) {
    return this.enterpriseService.upsertWhiteLabel(user, body);
  }

  @Post('partners/profile')
  @ApiOperation({ summary: 'Creer un profil partner' })
  async createPartnerProfile(
    @CurrentUser() user: CurrentUserType,
    @Body() body: { companyName: string; website?: string },
  ) {
    return this.enterpriseService.createPartnerProfile(user, body);
  }

  @Get('partners/overview')
  @ApiOperation({ summary: 'Recuperer la vue partner (referrals/commissions)' })
  async getPartnerOverview(@CurrentUser() user: CurrentUserType) {
    return this.enterpriseService.getPartnerOverview(user);
  }

  @Get('export/snapshot')
  @ApiOperation({ summary: 'Exporter un snapshot organisation (enterprise readiness)' })
  async exportSnapshot(@CurrentUser() user: CurrentUserType) {
    return this.enterpriseService.exportOrganizationSnapshot(user);
  }
}
