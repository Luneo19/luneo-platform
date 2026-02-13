import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CustomizationService } from './customization.service';
import { GenerateCustomizationDto } from './dto/generate-customization.dto';
import { CreateCustomizationDto } from './dto/create-customization.dto';
import { UpdateCustomizationDto } from './dto/update-customization.dto';
import { CurrentUser } from '@/common/types/user.types';
import { Request as ExpressRequest } from 'express';

@ApiTags('Customization')
@Controller('customization')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomizationController {
  constructor(private readonly customizationService: CustomizationService) {}

  @Get()
  @ApiOperation({ summary: 'List customizations for the brand' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({ status: 200, description: 'Customizations listed' })
  async list(
    @Query('productId') productId: string | undefined,
    @Query('status') status: string | undefined,
    @Query('limit') limit: string | undefined,
    @Query('offset') offset: string | undefined,
    @Req() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user.brandId;
    if (!brandId) throw new BadRequestException('User must have a brandId');
    return this.customizationService.list(brandId, {
      productId,
      status: status as 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED' | undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one customization' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Customization found' })
  @ApiResponse({ status: 404, description: 'Customization not found' })
  async getById(@Param('id') id: string, @Req() req: ExpressRequest & { user: CurrentUser }) {
    const brandId = req.user.brandId;
    if (!brandId) throw new BadRequestException('User must have a brandId');
    const customization = await this.customizationService.getById(id, brandId);
    if (!customization) throw new (await import('@nestjs/common')).NotFoundException('Customization not found');
    return customization;
  }

  @Post('generate')
  @ApiOperation({ summary: 'Génère une personnalisation pour un produit' })
  @ApiResponse({ status: 200, description: 'Personnalisation générée avec succès' })
  async generate(@Body() body: GenerateCustomizationDto) {
    return this.customizationService.generateCustomization(body);
  }

  @Post()
  @ApiOperation({ summary: 'Create customization (save configuration)' })
  @ApiResponse({ status: 201, description: 'Customization created' })
  async create(@Body() body: CreateCustomizationDto, @Req() req: ExpressRequest & { user: CurrentUser }) {
    const brandId = req.user.brandId;
    const userId = req.user.id;
    if (!brandId) throw new BadRequestException('User must have a brandId');
    return this.customizationService.create(brandId, userId, {
      productId: body.productId,
      zoneId: body.zoneId,
      prompt: body.prompt,
      name: body.name,
      description: body.description,
      font: body.font,
      color: body.color,
      size: body.size,
      effect: body.effect,
      orientation: body.orientation,
      options: body.options,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customization' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Customization updated' })
  @ApiResponse({ status: 404, description: 'Customization not found' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateCustomizationDto,
    @Req() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user.brandId;
    if (!brandId) throw new BadRequestException('User must have a brandId');
    return this.customizationService.update(id, brandId, {
      name: body.name,
      description: body.description,
      options: body.options,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete customization' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Customization deleted' })
  @ApiResponse({ status: 404, description: 'Customization not found' })
  async delete(@Param('id') id: string, @Req() req: ExpressRequest & { user: CurrentUser }) {
    const brandId = req.user.brandId;
    if (!brandId) throw new BadRequestException('User must have a brandId');
    await this.customizationService.delete(id, brandId);
    return { success: true };
  }
}
