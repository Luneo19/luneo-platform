/**
 * ★★★ CONTROLLER - AI TEMPLATES & ANIMATIONS ★★★
 * Controller NestJS pour la gestion des templates et animations AI
 * Respecte la Bible Luneo : validation Zod, ApiResponseBuilder, error handling
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { AIStudioService } from '../services/ai-studio.service';
import { CurrentUser } from '@/common/types/user.types';
import { User } from '@/common/decorators/user.decorator';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { GenerateAnimationDto } from '../dto/generate-animation.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';

@ApiTags('AI Templates & Animations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-studio')
export class AITemplatesController {
  constructor(private readonly aiStudioService: AIStudioService) {}

  // ========================================
  // TEMPLATES
  // ========================================

  @Get('templates')
  @ApiOperation({ summary: 'Get all AI templates' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'search', required: false, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of templates' })
  async getTemplates(
    @User() user: CurrentUser,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const offset = (pageNum - 1) * limitNum;

    return this.aiStudioService.getTemplates(user.brandId, {
      category,
      search,
      page: pageNum,
      limit: limitNum,
      offset,
    });
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get a specific template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Template details' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Template not found' })
  async getTemplate(@Param('id') id: string, @User() user: CurrentUser) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    return this.aiStudioService.getTemplate(id, user.brandId);
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create a new template' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Template created' })
  @HttpCode(HttpStatus.CREATED)
  async createTemplate(
    @Body() dto: CreateTemplateDto,
    @User() user: CurrentUser,
  ) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    return this.aiStudioService.createTemplate(user.brandId, user.id, dto);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update a template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Template updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Template not found' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
    @User() user: CurrentUser,
  ) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    return this.aiStudioService.updateTemplate(id, user.brandId, dto);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete a template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Template deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Template not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTemplate(@Param('id') id: string, @User() user: CurrentUser) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    await this.aiStudioService.deleteTemplate(id, user.brandId);
  }

  // ========================================
  // ANIMATIONS
  // ========================================

  @Get('animations')
  @ApiOperation({ summary: 'Get all animations' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of animations' })
  async getAnimations(
    @User() user: CurrentUser,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const offset = (pageNum - 1) * limitNum;

    return this.aiStudioService.getAnimations(user.brandId, user.id, {
      status,
      page: pageNum,
      limit: limitNum,
      offset,
    });
  }

  @Get('animations/:id')
  @ApiOperation({ summary: 'Get a specific animation' })
  @ApiParam({ name: 'id', description: 'Animation ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Animation details' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Animation not found' })
  async getAnimation(@Param('id') id: string, @User() user: CurrentUser) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    return this.aiStudioService.getAnimation(id, user.brandId, user.id);
  }

  @Post('animations/generate')
  @ApiOperation({ summary: 'Generate a new animation' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Animation generation started' })
  @HttpCode(HttpStatus.CREATED)
  async generateAnimation(
    @Body() dto: GenerateAnimationDto,
    @User() user: CurrentUser,
  ) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    return this.aiStudioService.generateAnimation(user.brandId, user.id, dto);
  }

  @Delete('animations/:id')
  @ApiOperation({ summary: 'Delete an animation' })
  @ApiParam({ name: 'id', description: 'Animation ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Animation deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Animation not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAnimation(@Param('id') id: string, @User() user: CurrentUser) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    await this.aiStudioService.deleteAnimation(id, user.brandId, user.id);
  }
}



