import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { CurrentUser } from '@/common/types/user.types';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AssetFileService } from '../services/asset-file.service';
import { AssetFolderService } from '../services/asset-folder.service';
import { UploadFileDto } from '../dto/upload-file.dto';
import { CreateFolderDto } from '../dto/create-folder.dto';

@ApiTags('asset-hub')
@ApiBearerAuth()
@Controller('asset-hub')
@UseGuards(JwtAuthGuard)
export class AssetHubController {
  constructor(
    private readonly fileService: AssetFileService,
    private readonly folderService: AssetFolderService,
  ) {}

  // ========================================
  // FILES ENDPOINTS
  // ========================================

  @Get('files')
  @ApiOperation({
    summary: 'Liste les fichiers d\'une organisation',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des fichiers récupérée avec succès',
  })
  async findAllFiles(
    @Request() req: ExpressRequest & { user: CurrentUser },
    @Query('projectId') projectId?: string,
    @Query('folderId') folderId?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const brandId = req.user?.brandId;
    if (!brandId) {
      if (req.user?.role === 'PLATFORM_ADMIN') {
        return { data: [], total: 0, page: 1, limit: 20 };
      }
      throw new BadRequestException('User must have a brandId');
    }
    return this.fileService.findAll(
      brandId,
      { projectId, folderId, type, search },
      { page, limit },
    );
  }

  @Get('files/:id')
  @ApiOperation({
    summary: 'Récupère un fichier par son ID',
  })
  async findOneFile(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user?.brandId;
    if (!brandId) {
      if (req.user?.role === 'PLATFORM_ADMIN') {
        return null;
      }
      throw new BadRequestException('User must have a brandId');
    }
    return this.fileService.findOne(id, brandId);
  }

  @Post('files')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload un fichier',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string; size: number } | undefined,
    @Body() dto: UploadFileDto,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const brandId = req.user?.brandId;
    if (!brandId) throw new BadRequestException('User must have a brandId');
    return this.fileService.upload(
      brandId,
      file as { buffer: Buffer; mimetype: string; originalname: string; size: number },
      dto,
      req.user.id,
    );
  }

  @Delete('files/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprime un fichier',
  })
  async removeFile(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user?.brandId;
    if (!brandId) throw new BadRequestException('User must have a brandId');
    return this.fileService.remove(id, brandId);
  }

  // ========================================
  // FOLDERS ENDPOINTS
  // ========================================

  @Get('folders')
  @ApiOperation({
    summary: 'Liste les dossiers d\'une organisation',
  })
  async findAllFolders(
    @Request() req: ExpressRequest & { user: CurrentUser },
    @Query('parentId') parentId?: string,
  ) {
    const brandId = req.user?.brandId;
    if (!brandId) {
      if (req.user?.role === 'PLATFORM_ADMIN') {
        return [];
      }
      throw new BadRequestException('User must have a brandId');
    }
    return this.folderService.findAll(brandId, parentId);
  }

  @Get('folders/:id')
  @ApiOperation({
    summary: 'Récupère un dossier par son ID',
  })
  async findOneFolder(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user?.brandId;
    if (!brandId) {
      if (req.user?.role === 'PLATFORM_ADMIN') {
        return null;
      }
      throw new BadRequestException('User must have a brandId');
    }
    return this.folderService.findOne(id, brandId);
  }

  @Post('folders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crée un nouveau dossier',
  })
  async createFolder(
    @Body() dto: CreateFolderDto,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user?.brandId;
    if (!brandId) throw new BadRequestException('User must have a brandId');
    return this.folderService.create(brandId, dto);
  }

  @Delete('folders/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprime un dossier',
  })
  async removeFolder(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user?.brandId;
    if (!brandId) throw new BadRequestException('User must have a brandId');
    return this.folderService.remove(id, brandId);
  }
}
