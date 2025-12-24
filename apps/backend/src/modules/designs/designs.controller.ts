import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DesignsService } from './designs.service';

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
  async create(@Body() createDesignDto: any, @Request() req) {
    return this.designsService.create(createDesignDto, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les détails d\'un design' })
  @ApiParam({ name: 'id', description: 'ID du design' })
  @ApiResponse({
    status: 200,
    description: 'Détails du design',
  })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.designsService.findOne(id, req.user);
  }

  @Post(':id/upgrade-highres')
  @ApiOperation({ summary: 'Générer une version haute résolution' })
  @ApiParam({ name: 'id', description: 'ID du design' })
  @ApiResponse({
    status: 200,
    description: 'Génération haute résolution lancée',
  })
  async upgradeToHighRes(@Param('id') id: string, @Request() req) {
    return this.designsService.upgradeToHighRes(id, req.user);
  }
}
