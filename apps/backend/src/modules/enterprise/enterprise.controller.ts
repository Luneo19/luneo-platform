import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { BrandOwnershipGuard } from '@/common/guards/brand-ownership.guard';
import { Roles } from '@/common/guards/roles.guard';
import { WhiteLabelService } from './services/white-label.service';
import { SSOService } from './services/sso.service';
import { SLASupportService } from './services/sla-support.service';
import { CreateThemeDto } from './dto/create-theme.dto';
import { CreateCustomDomainDto } from './dto/create-custom-domain.dto';
import { CreateSAMLConfigDto } from './dto/create-saml-config.dto';
import { CreateOIDCConfigDto } from './dto/create-oidc-config.dto';
import { CreateSLATicketDto } from './dto/create-sla-ticket.dto';
import { UpdateSLATicketStatusDto } from './dto/update-sla-ticket-status.dto';

@ApiTags('Enterprise')
@Controller('enterprise')
@UseGuards(JwtAuthGuard, BrandOwnershipGuard)
@ApiBearerAuth()
export class EnterpriseController {
  constructor(
    private readonly whiteLabel: WhiteLabelService,
    private readonly sso: SSOService,
    private readonly slaSupport: SLASupportService,
  ) {}

  // ========================================
  // WHITE-LABEL (PHASE 8)
  // ========================================

  @Post('white-label/themes')
  @ApiOperation({ summary: 'Crée un thème personnalisé' })
  @ApiResponse({ status: 201, description: 'Thème créé' })
  async createTheme(@Body() dto: CreateThemeDto) {
    return this.whiteLabel.createTheme(dto);
  }

  @Get('white-label/themes/:brandId')
  @ApiOperation({ summary: 'Obtient le thème actif d\'un brand' })
  @ApiResponse({ status: 200, description: 'Thème récupéré' })
  async getActiveTheme(@Param('brandId') brandId: string) {
    return this.whiteLabel.getActiveTheme(brandId);
  }

  @Post('white-label/domains')
  @ApiOperation({ summary: 'Crée un domaine personnalisé' })
  @ApiResponse({ status: 201, description: 'Domaine créé' })
  async createCustomDomain(@Body() dto: CreateCustomDomainDto) {
    return this.whiteLabel.createCustomDomain(dto);
  }

  @Post('white-label/domains/:domainId/activate')
  @ApiOperation({ summary: 'Active un domaine personnalisé' })
  @ApiResponse({ status: 200, description: 'Domaine activé' })
  async activateDomain(@Param('domainId') domainId: string) {
    return this.whiteLabel.activateDomain(domainId);
  }

  // ========================================
  // SSO/SAML (PHASE 8)
  // ========================================

  @Post('sso/saml')
  @ApiOperation({ summary: 'Crée une configuration SAML' })
  @ApiResponse({ status: 201, description: 'Configuration SAML créée' })
  async createSAMLConfig(@Body() dto: CreateSAMLConfigDto) {
    return this.sso.createSAMLConfig(dto);
  }

  @Post('sso/oidc')
  @ApiOperation({ summary: 'Crée une configuration OIDC' })
  @ApiResponse({ status: 201, description: 'Configuration OIDC créée' })
  async createOIDCConfig(@Body() dto: CreateOIDCConfigDto) {
    return this.sso.createOIDCConfig(dto);
  }

  @Get('sso/:brandId/:provider')
  @ApiOperation({ summary: 'Obtient une configuration SSO' })
  @ApiResponse({ status: 200, description: 'Configuration SSO récupérée' })
  async getSSOConfig(
    @Param('brandId') brandId: string,
    @Param('provider') provider: 'saml' | 'oidc',
  ) {
    return this.sso.getSSOConfig(brandId, provider);
  }

  @Post('sso/:brandId/saml/initiate')
  @ApiOperation({ summary: 'Initie une connexion SAML' })
  @ApiResponse({ status: 200, description: 'URL SAML générée' })
  async initiateSAML(
    @Param('brandId') brandId: string,
    @Query('relayState') relayState?: string,
  ) {
    return { loginUrl: await this.sso.initiateSAML(brandId, relayState) };
  }

  // ========================================
  // SLA & SUPPORT (PHASE 8)
  // ========================================

  @Get('sla/config/:planId')
  @ApiOperation({ summary: 'Obtient la configuration SLA d\'un plan' })
  @ApiResponse({ status: 200, description: 'Configuration SLA récupérée' })
  async getSLAConfig(@Param('planId') planId: string) {
    return this.slaSupport.getSLAConfig(planId);
  }

  @Post('sla/tickets')
  @ApiOperation({ summary: 'Crée un ticket avec SLA tracking' })
  @ApiResponse({ status: 201, description: 'Ticket SLA créé' })
  async createSLATicket(@Body() body: CreateSLATicketDto) {
    return this.slaSupport.createSLATicket(body.ticketId, body.brandId, body.priority);
  }

  @Get('sla/tickets/:ticketId')
  @ApiOperation({ summary: 'Obtient un ticket SLA' })
  @ApiResponse({ status: 200, description: 'Ticket SLA récupéré' })
  async getSLATicket(@Param('ticketId') ticketId: string) {
    return this.slaSupport.getSLATicket(ticketId);
  }

  @Put('sla/tickets/:ticketId/status')
  @ApiOperation({ summary: 'Met à jour le statut SLA d\'un ticket' })
  @ApiResponse({ status: 200, description: 'Statut SLA mis à jour' })
  async updateSLATicketStatus(
    @Param('ticketId') ticketId: string,
    @Body() body: UpdateSLATicketStatusDto,
  ) {
    return this.slaSupport.updateSLATicketStatus(
      ticketId,
      body.firstResponseAt ? new Date(body.firstResponseAt) : undefined,
      body.resolvedAt ? new Date(body.resolvedAt) : undefined,
    );
  }

  @Get('sla/metrics/:brandId')
  @ApiOperation({ summary: 'Calcule les métriques SLA pour un brand' })
  @ApiResponse({ status: 200, description: 'Métriques SLA calculées' })
  async calculateSLAMetrics(
    @Param('brandId') brandId: string,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
  ) {
    return this.slaSupport.calculateSLAMetrics(
      brandId,
      new Date(periodStart),
      new Date(periodEnd),
    );
  }
}
