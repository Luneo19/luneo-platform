import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser as CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { CurrentUser } from '@/common/types/user.types';
import { ConsentType } from '@prisma/client';
import { DataExportService } from './data-export.service';
import { DataDeletionService } from './data-deletion.service';
import { ConsentManagerService } from './consent-manager.service';
import { RetentionPolicyService } from './retention-policy.service';
import { DpaGeneratorService } from './dpa-generator.service';

@Controller('privacy')
@UseGuards(JwtAuthGuard)
export class PrivacyController {
  constructor(
    private readonly dataExportService: DataExportService,
    private readonly dataDeletionService: DataDeletionService,
    private readonly consentManagerService: ConsentManagerService,
    private readonly retentionPolicyService: RetentionPolicyService,
    private readonly dpaGeneratorService: DpaGeneratorService,
  ) {}

  @Get('contacts/:contactId/export')
  async exportContactData(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('contactId') contactId: string,
  ) {
    if (!user.organizationId) return { data: null };
    return this.dataExportService.exportContactData(user.organizationId, contactId);
  }

  @Post('contacts/:contactId/deletion-request')
  async requestDeletion(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('contactId') contactId: string,
  ) {
    if (!user.organizationId) return { success: false };
    const request = await this.dataDeletionService.requestDeletion(
      user.organizationId,
      contactId,
      user.id,
    );
    return { success: true, request };
  }

  @Post('consent')
  async setConsent(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() body: { contactId: string; consentType: ConsentType; granted: boolean; policyVersion?: string },
  ) {
    if (!user.organizationId) return { success: false };
    const record = await this.consentManagerService.setConsent({
      organizationId: user.organizationId,
      contactId: body.contactId,
      consentType: body.consentType,
      granted: body.granted,
      policyVersion: body.policyVersion,
    });
    return { success: true, record };
  }

  @Get('retention/preview')
  async retentionPreview() {
    return this.retentionPolicyService.purgeExpiredData();
  }

  @Get('dpa/template')
  async generateDpa(@CurrentUserDecorator() user: CurrentUser) {
    return this.dpaGeneratorService.generateTemplate({
      organizationName: user.organization?.name ?? 'Organization',
      generatedBy: user.email,
    });
  }
}
