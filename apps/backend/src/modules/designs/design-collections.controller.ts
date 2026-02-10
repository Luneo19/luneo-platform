import {
  Controller,
  Get,
  Post,
  Patch,
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
import { DesignCollectionsService } from './services/design-collections.service';
import { CreateDesignCollectionDto } from './dto/create-design-collection.dto';
import { UpdateDesignCollectionDto } from './dto/update-design-collection.dto';
import { AddDesignToCollectionDto } from './dto/add-design-to-collection.dto';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import type { CurrentUser } from '@/common/types/user.types';

@ApiTags('designs')
@Controller('designs/collections')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DesignCollectionsController {
  constructor(private readonly designCollectionsService: DesignCollectionsService) {}

  @Get()
  @ApiOperation({ summary: 'List design collections' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of collections' })
  async list(
    @Request() req: ExpressRequest & { user: CurrentUser },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.id;
    const brandId = req.user.brandId ?? '';
    return this.designCollectionsService.list(brandId, userId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a design collection by id' })
  @ApiParam({ name: 'id', description: 'Collection ID' })
  @ApiResponse({ status: 200, description: 'Collection details' })
  async findOne(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const userId = req.user.id;
    const brandId = req.user.brandId ?? '';
    return this.designCollectionsService.findOne(id, userId, brandId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a design collection' })
  @ApiResponse({ status: 201, description: 'Collection created' })
  async create(
    @Body() dto: CreateDesignCollectionDto,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const userId = req.user.id;
    const brandId = req.user.brandId ?? '';
    return this.designCollectionsService.create(dto, userId, brandId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a design collection' })
  @ApiParam({ name: 'id', description: 'Collection ID' })
  @ApiResponse({ status: 200, description: 'Collection updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDesignCollectionDto,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const userId = req.user.id;
    const brandId = req.user.brandId ?? '';
    return this.designCollectionsService.update(id, dto, userId, brandId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a design collection' })
  @ApiParam({ name: 'id', description: 'Collection ID' })
  @ApiResponse({ status: 200, description: 'Collection deleted' })
  async delete(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const userId = req.user.id;
    const brandId = req.user.brandId ?? '';
    return this.designCollectionsService.delete(id, userId, brandId);
  }

  @Post(':id/designs')
  @ApiOperation({ summary: 'Add a design to a collection' })
  @ApiParam({ name: 'id', description: 'Collection ID' })
  @ApiResponse({ status: 201, description: 'Design added to collection' })
  async addDesign(
    @Param('id') id: string,
    @Body() dto: AddDesignToCollectionDto,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const userId = req.user.id;
    const brandId = req.user.brandId ?? '';
    return this.designCollectionsService.addDesign(
      id,
      dto.designId,
      userId,
      brandId,
      dto.notes,
    );
  }

  @Delete(':id/designs/:designId')
  @ApiOperation({ summary: 'Remove a design from a collection' })
  @ApiParam({ name: 'id', description: 'Collection ID' })
  @ApiParam({ name: 'designId', description: 'Design ID' })
  @ApiResponse({ status: 200, description: 'Design removed from collection' })
  async removeDesign(
    @Param('id') id: string,
    @Param('designId') designId: string,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const userId = req.user.id;
    const brandId = req.user.brandId ?? '';
    return this.designCollectionsService.removeDesign(id, designId, userId, brandId);
  }
}
