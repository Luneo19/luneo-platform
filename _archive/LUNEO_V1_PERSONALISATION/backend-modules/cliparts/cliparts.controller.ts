import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ClipartsService } from './cliparts.service';
import { CreateClipartDto, UpdateClipartDto } from './dto/cliparts.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

@ApiTags('cliparts')
@Controller('cliparts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClipartsController {
  constructor(private readonly clipartsService: ClipartsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les cliparts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'publicOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Liste des cliparts' })
  async findAll(
    @Request() req: ExpressRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('publicOnly') publicOnly?: string,
  ) {
    return this.clipartsService.findAll((req.user as { id: string; brandId?: string | null }).id, (req.user as { id: string; brandId?: string | null }).brandId || null, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      category,
      search,
      publicOnly: publicOnly === 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un clipart' })
  @ApiParam({ name: 'id', description: 'ID du clipart' })
  @ApiResponse({ status: 200, description: 'Détails du clipart' })
  async findOne(@Param('id') id: string, @Request() req: ExpressRequest) {
    const u = req.user as { id: string; brandId?: string | null };
    return this.clipartsService.findOne(id, u.id, u.brandId || null);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau clipart' })
  @ApiResponse({ status: 201, description: 'Clipart créé' })
  async create(@Body() createDto: CreateClipartDto, @Request() req: ExpressRequest) {
    const u = req.user as { id: string; brandId?: string | null };
    return this.clipartsService.create(createDto as unknown as Parameters<ClipartsService['create']>[0], u.id, u.brandId || null);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un clipart' })
  @ApiParam({ name: 'id', description: 'ID du clipart' })
  @ApiResponse({ status: 200, description: 'Clipart mis à jour' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateClipartDto, @Request() req: ExpressRequest) {
    const u = req.user as { id: string; brandId?: string | null };
    return this.clipartsService.update(id, updateDto, u.id, u.brandId || null);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un clipart' })
  @ApiParam({ name: 'id', description: 'ID du clipart' })
  @ApiResponse({ status: 200, description: 'Clipart supprimé' })
  async delete(@Param('id') id: string, @Request() req: ExpressRequest) {
    const u = req.user as { id: string; brandId?: string | null };
    return this.clipartsService.delete(id, u.id, u.brandId || null);
  }
}
