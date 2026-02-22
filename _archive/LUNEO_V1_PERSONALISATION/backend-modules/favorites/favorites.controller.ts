import {
  Controller,
  Get,
  Post,
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
import { Throttle } from '@nestjs/throttler';
import { FavoritesService } from './favorites.service';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

@ApiTags('favorites')
@Controller('library/favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les favoris de la bibliothèque' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Liste des favoris' })
  async findAll(
    @Request() req: ExpressRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    return this.favoritesService.findAll((req.user as { id: string }).id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      type,
    });
  }

  @Post()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Ajouter un favori' })
  @ApiResponse({ status: 201, description: 'Favori ajouté' })
  async create(@Body() createDto: AddFavoriteDto, @Request() req: ExpressRequest) {
    return this.favoritesService.create(createDto, (req.user as { id: string }).id);
  }

  @Delete(':id')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Supprimer un favori' })
  @ApiParam({ name: 'id', description: 'ID du favori' })
  @ApiResponse({ status: 200, description: 'Favori supprimé' })
  async delete(@Param('id') id: string, @Request() req: ExpressRequest) {
    return this.favoritesService.delete(id, (req.user as { id: string }).id);
  }
}
