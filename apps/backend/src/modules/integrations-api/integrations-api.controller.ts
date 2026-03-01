import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '@/common/types/user.types';
import { IntegrationsApiService } from './integrations-api.service';

@ApiTags('Integrations')
@ApiBearerAuth()
@Controller('integrations')
export class IntegrationsApiController {
  constructor(private readonly integrationsApiService: IntegrationsApiService) {}

  @Get('status')
  @ApiOperation({
    summary: 'Status des intégrations de l’organisation courante',
  })
  async getStatus(@CurrentUser() user: CurrentUserType) {
    if (!user.organizationId) {
      throw new BadRequestException('Organisation requise');
    }
    return this.integrationsApiService.getOrganizationIntegrationsStatus(
      user.organizationId,
    );
  }

  @Get('health')
  @ApiOperation({
    summary: 'Santé opérationnelle des intégrations',
  })
  async getHealth(@CurrentUser() user: CurrentUserType) {
    if (!user.organizationId) {
      throw new BadRequestException('Organisation requise');
    }
    return this.integrationsApiService.getOrganizationIntegrationsHealth(
      user.organizationId,
    );
  }

  @Post(':type/sync')
  @ApiOperation({
    summary: 'Déclencher une synchronisation intégration',
  })
  async triggerSync(
    @CurrentUser() user: CurrentUserType,
    @Param('type') type: string,
  ) {
    if (!user.organizationId) {
      throw new BadRequestException('Organisation requise');
    }
    return this.integrationsApiService.triggerSync(
      user.organizationId,
      type,
      user.id,
    );
  }
}
