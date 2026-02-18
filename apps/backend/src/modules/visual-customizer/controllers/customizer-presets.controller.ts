import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '@/common/types/user.types';
import { CustomizerOwnerGuard } from '../guards/customizer-owner.guard';
import { CustomizerPresetsService } from '../services/customizer-presets.service';
import { CreatePresetDto } from '../dto/presets/create-preset.dto';
import { UpdatePresetDto } from '../dto/presets/update-preset.dto';

@ApiTags('Visual Customizer - Presets')
@Controller('visual-customizer/customizers/:customizerId/presets')
@UseGuards(JwtAuthGuard, CustomizerOwnerGuard)
@ApiBearerAuth()
export class CustomizerPresetsController {
  constructor(private readonly presetsService: CustomizerPresetsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new preset',
    description: 'Creates a new preset template for a customizer',
  })
  @ApiParam({
    name: 'customizerId',
    description: 'Customizer UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Preset created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or maximum presets limit reached',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customizer not found',
  })
  async create(
    @Param('customizerId') customizerId: string,
    @Body(ValidationPipe) dto: CreatePresetDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.presetsService.create(customizerId, dto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'List presets',
    description: 'Get all presets for a customizer with optional filters',
  })
  @ApiParam({
    name: 'customizerId',
    description: 'Customizer UUID',
    type: String,
  })
  @ApiQuery({
    name: 'category',
    description: 'Filter by category',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of presets retrieved successfully',
  })
  async list(
    @Param('customizerId') customizerId: string,
    @Query('category') category?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.presetsService.findAll(customizerId, {
      category,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get preset by ID',
    description: 'Retrieves a single preset with its canvas data',
  })
  @ApiParam({
    name: 'customizerId',
    description: 'Customizer UUID',
    type: String,
  })
  @ApiParam({
    name: 'id',
    description: 'Preset UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Preset retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Preset not found',
  })
  async getOne(
    @Param('customizerId') customizerId: string,
    @Param('id') id: string,
  ) {
    return this.presetsService.findOne(id, customizerId);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update preset',
    description: 'Updates an existing preset configuration',
  })
  @ApiParam({
    name: 'customizerId',
    description: 'Customizer UUID',
    type: String,
  })
  @ApiParam({
    name: 'id',
    description: 'Preset UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Preset updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Preset not found',
  })
  async update(
    @Param('customizerId') customizerId: string,
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdatePresetDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.presetsService.update(id, customizerId, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete preset',
    description: 'Deletes a preset',
  })
  @ApiParam({
    name: 'customizerId',
    description: 'Customizer UUID',
    type: String,
  })
  @ApiParam({
    name: 'id',
    description: 'Preset UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Preset deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Preset not found',
  })
  async delete(
    @Param('customizerId') customizerId: string,
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.presetsService.delete(id, customizerId, user);
    return;
  }
}
