import 'multer';
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '@/common/types/user.types';
import { CustomizerAssetsService } from '../services/customizer-assets.service';
import { UploadAssetDto } from '../dto/assets/upload-asset.dto';
import { AssetQueryDto } from '../dto/assets/asset-query.dto';
import { FileUploadValidationInterceptor } from '../interceptors/file-upload.interceptor';
import { ImageProcessingInterceptor } from '../interceptors/image-processing.interceptor';

@ApiTags('Visual Customizer - Assets')
@Controller('visual-customizer/assets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomizerAssetsController {
  constructor(private readonly assetsService: CustomizerAssetsService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file'),
    FileUploadValidationInterceptor,
    ImageProcessingInterceptor,
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload asset',
    description: 'Uploads an image or font asset for use in customizers',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        name: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
        type: {
          type: 'string',
          enum: ['IMAGE', 'FONT', 'CLIPART'],
        },
        customizerId: {
          type: 'string',
          format: 'uuid',
        },
        visibility: {
          type: 'string',
          enum: ['PUBLIC', 'PRIVATE'],
        },
        category: {
          type: 'string',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Asset uploaded successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or input data',
  })
  @ApiResponse({
    status: HttpStatus.PAYLOAD_TOO_LARGE,
    description: 'File size exceeds maximum allowed',
  })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body(ValidationPipe) dto: UploadAssetDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.assetsService.upload(file, dto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'List assets',
    description: 'Get a paginated list of assets with optional filters',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of assets retrieved successfully',
  })
  async list(
    @Query(ValidationPipe) query: AssetQueryDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.assetsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get asset by ID',
    description: 'Retrieves a single asset',
  })
  @ApiParam({
    name: 'id',
    description: 'Asset UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Asset retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Asset not found',
  })
  async getOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.assetsService.findOne(id, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete asset',
    description: 'Deletes an asset and removes it from storage',
  })
  @ApiParam({
    name: 'id',
    description: 'Asset UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Asset deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Asset not found',
  })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.assetsService.delete(id, user);
    return;
  }

  @Get('clipart/categories')
  @ApiOperation({
    summary: 'List clipart categories',
    description: 'Get all available clipart categories',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of categories retrieved successfully',
  })
  async listClipartCategories(@CurrentUser() user: CurrentUserType) {
    return this.assetsService.getClipartCategories(user);
  }

  @Get('clipart/:categoryId')
  @ApiOperation({
    summary: 'List clipart in category',
    description: 'Get all clipart assets in a specific category',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Category ID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of clipart retrieved successfully',
  })
  async listClipart(
    @Param('categoryId') categoryId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: CurrentUserType,
  ) {
    return this.assetsService.getClipartByCategory(categoryId, { page, limit }, user!);
  }

  @Get('fonts')
  @ApiOperation({
    summary: 'List fonts',
    description: 'Get all available fonts (system and custom)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of fonts retrieved successfully',
  })
  async listFonts(
    @Query('customizerId') customizerId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    if (!customizerId) {
      throw new BadRequestException('customizerId is required');
    }
    return this.assetsService.getFonts(customizerId, user);
  }

  @Post('fonts/upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload font',
    description: 'Uploads a custom font file',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        name: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Font uploaded successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid font file',
  })
  async uploadFont(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserType,
    @Body('name') name: string,
    @Body('fontFamily') fontFamily?: string,
    @Body('description') description?: string,
  ) {
    return this.assetsService.uploadFont(file, { name, fontFamily, description }, user);
  }
}
