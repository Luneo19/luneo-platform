import {
  Body,
  Controller,
  DefaultValuePipe,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '@/common/types/user.types';
import { PublicApiService } from './public-api.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { SandboxExecuteDto } from './dto/sandbox-execute.dto';

@ApiTags('public-api-management')
@Controller('public/developer')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PublicApiManagementController {
  constructor(private readonly publicApiService: PublicApiService) {}

  private requireOrg(user: CurrentUserType): string {
    if (!user.organizationId) {
      throw new ForbiddenException('Organisation requise');
    }
    return user.organizationId;
  }

  @Get('api-keys')
  @ApiOperation({ summary: 'Lister les cles API de l organisation' })
  async listApiKeys(@CurrentUser() user: CurrentUserType) {
    return this.publicApiService.listApiKeys(this.requireOrg(user));
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Lister les journaux d audit developpeur (API publique)' })
  async listAuditLogs(
    @CurrentUser() user: CurrentUserType,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.publicApiService.listDeveloperAudits(
      this.requireOrg(user),
      limit,
    );
  }

  @Post('api-keys')
  @ApiOperation({ summary: 'Creer une nouvelle cle API (affichee une seule fois)' })
  async createApiKey(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.publicApiService.createApiKey(this.requireOrg(user), dto);
  }

  @Post('api-keys/:id/revoke')
  @ApiOperation({ summary: 'Revoquer une cle API' })
  async revokeApiKey(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
  ) {
    return this.publicApiService.revokeApiKey(this.requireOrg(user), id);
  }

  @Post('api-keys/:id/rotate')
  @ApiOperation({ summary: 'Rotation de cle API (revoque puis recree)' })
  async rotateApiKey(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
  ) {
    return this.publicApiService.rotateApiKey(this.requireOrg(user), id);
  }

  @Post('sandbox/agents/:agentId/execute')
  @ApiOperation({ summary: 'Executer un agent en mode sandbox (sans persistence)' })
  async executeSandbox(
    @CurrentUser() user: CurrentUserType,
    @Param('agentId') agentId: string,
    @Body() dto: SandboxExecuteDto,
  ) {
    return this.publicApiService.runSandboxAgent(
      this.requireOrg(user),
      agentId,
      dto,
    );
  }

  @Get('sdk/snippets')
  @ApiOperation({ summary: 'Recuperer des snippets SDK pour integration rapide' })
  async sdkSnippets(@Query('baseUrl') baseUrl?: string) {
    return this.publicApiService.getSdkSnippets(
      baseUrl ?? 'https://api.luneo.app',
    );
  }
}
