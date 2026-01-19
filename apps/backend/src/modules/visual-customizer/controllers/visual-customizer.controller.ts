import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { VisualCustomizerService } from '../services/visual-customizer.service';
import { CreateVisualCustomizerDto } from '../dto/create-visual-customizer.dto';
import { UpdateVisualCustomizerDto } from '../dto/update-visual-customizer.dto';
import { AddLayerDto } from '../dto/add-layer.dto';

@ApiTags('visual-customizer')
@ApiBearerAuth()
@Controller('visual-customizer')
@UseGuards(JwtAuthGuard)
export class VisualCustomizerController {
  constructor(private readonly customizerService: VisualCustomizerService) {}

  @Get('customizers')
  @ApiOperation({
    summary: 'Liste les customizers d\'un projet',
  })
  @ApiParam({ name: 'projectId', description: 'ID du projet' })
  @ApiResponse({
    status: 200,
    description: 'Liste des customizers récupérée avec succès',
  })
  async findAllCustomizers(
    @Query('projectId') projectId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.customizerService.findAll(projectId, { page, limit });
  }

  @Get('customizers/:id')
  @ApiOperation({
    summary: 'Récupère un customizer par son ID',
  })
  @ApiParam({ name: 'id', description: 'ID du customizer' })
  async findOneCustomizer(
    @Param('id') id: string,
    @Query('projectId') projectId: string,
  ) {
    return this.customizerService.findOne(id, projectId);
  }

  @Post('customizers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crée un nouveau customizer',
  })
  async createCustomizer(
    @Body() dto: CreateVisualCustomizerDto,
    @Query('projectId') projectId: string,
  ) {
    return this.customizerService.create(projectId, dto);
  }

  @Patch('customizers/:id')
  @ApiOperation({
    summary: 'Met à jour un customizer',
  })
  async updateCustomizer(
    @Param('id') id: string,
    @Query('projectId') projectId: string,
    @Body() dto: UpdateVisualCustomizerDto,
  ) {
    return this.customizerService.update(id, projectId, dto);
  }

  @Delete('customizers/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprime un customizer',
  })
  async removeCustomizer(
    @Param('id') id: string,
    @Query('projectId') projectId: string,
  ) {
    return this.customizerService.remove(id, projectId);
  }

  @Post('customizers/:id/layers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ajoute une couche à un customizer',
  })
  async addLayer(
    @Param('id') customizerId: string,
    @Query('projectId') projectId: string,
    @Body() dto: AddLayerDto,
  ) {
    return this.customizerService.addLayer(customizerId, projectId, dto);
  }

  @Delete('customizers/:id/layers/:layerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retire une couche d\'un customizer',
  })
  async removeLayer(
    @Param('id') customizerId: string,
    @Query('projectId') projectId: string,
    @Param('layerId') layerId: string,
  ) {
    return this.customizerService.removeLayer(customizerId, projectId, layerId);
  }
}
