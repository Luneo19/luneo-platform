import { Controller, Get, Post, Param, Body, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DesignsService } from './designs.service';
import { RequireQuota } from '@/common/decorators/quota.decorator';
import type { Request } from 'express';

@ApiTags('designs')
@Controller('designs')
@ApiBearerAuth()
export class DesignsController {
  constructor(private readonly designsService: DesignsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau design avec IA' })
  @ApiResponse({
    status: 201,
    description: 'Design créé et génération IA lancée',
  })
  @RequireQuota({ metric: 'ai_generations', amountField: 'body.batchSize' })
  async create(@Body() createDesignDto: any, @Req() req: Request) {
    return this.designsService.create(createDesignDto, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les détails d\'un design' })
  @ApiParam({ name: 'id', description: 'ID du design' })
  @ApiResponse({
    status: 200,
    description: 'Détails du design',
  })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    return this.designsService.findOne(id, req.user);
  }

  @Post(':id/upgrade-highres')
  @ApiOperation({ summary: 'Générer une version haute résolution' })
  @ApiParam({ name: 'id', description: 'ID du design' })
  @ApiResponse({
    status: 200,
    description: 'Génération haute résolution lancée',
  })
  @RequireQuota({ metric: 'renders_2d' })
  async upgradeToHighRes(@Param('id') id: string, @Req() req: Request) {
    return this.designsService.upgradeToHighRes(id, req.user);
  }
}
