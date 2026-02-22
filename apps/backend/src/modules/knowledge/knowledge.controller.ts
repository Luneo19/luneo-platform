// @ts-nocheck
import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
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
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/types/user.types';
import { KnowledgeService } from './knowledge.service';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { UpdateKnowledgeBaseDto } from './dto/update-knowledge-base.dto';
import { CreateKnowledgeSourceDto } from './dto/create-knowledge-source.dto';

@ApiTags('knowledge')
@Controller('knowledge')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get('bases')
  @ApiOperation({ summary: 'Lister les bases de connaissances' })
  @ApiResponse({ status: 200, description: 'Liste des bases de connaissances' })
  listBases(@Request() req: ExpressRequest) {
    const user = req.user as CurrentUser;
    return this.knowledgeService.listBases(user);
  }

  @Post('bases')
  @ApiOperation({ summary: 'Créer une base de connaissances' })
  @ApiResponse({ status: 201, description: 'Base créée' })
  createBase(@Request() req: ExpressRequest, @Body() dto: CreateKnowledgeBaseDto) {
    const user = req.user as CurrentUser;
    return this.knowledgeService.createBase(user, dto);
  }

  @Get('bases/:id')
  @ApiOperation({ summary: 'Détail d\'une base de connaissances' })
  @ApiParam({ name: 'id', description: 'ID de la base' })
  @ApiResponse({ status: 200, description: 'Détail de la base' })
  getBase(@Request() req: ExpressRequest, @Param('id') id: string) {
    const user = req.user as CurrentUser;
    return this.knowledgeService.getBase(user, id);
  }

  @Patch('bases/:id')
  @ApiOperation({ summary: 'Mettre à jour une base de connaissances' })
  @ApiParam({ name: 'id', description: 'ID de la base' })
  @ApiResponse({ status: 200, description: 'Base mise à jour' })
  updateBase(
    @Request() req: ExpressRequest,
    @Param('id') id: string,
    @Body() dto: UpdateKnowledgeBaseDto,
  ) {
    const user = req.user as CurrentUser;
    return this.knowledgeService.updateBase(user, id, dto);
  }

  @Delete('bases/:id')
  @ApiOperation({ summary: 'Supprimer une base de connaissances' })
  @ApiParam({ name: 'id', description: 'ID de la base' })
  @ApiResponse({ status: 200, description: 'Base supprimée' })
  deleteBase(@Request() req: ExpressRequest, @Param('id') id: string) {
    const user = req.user as CurrentUser;
    return this.knowledgeService.deleteBase(user, id);
  }

  @Post('bases/:id/sources/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Uploader un fichier vers une base' })
  @ApiParam({ name: 'id', description: 'ID de la base' })
  @ApiResponse({ status: 201, description: 'Fichier uploadé et indexation déclenchée' })
  uploadSource(
    @Request() req: ExpressRequest,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const user = req.user as CurrentUser;
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }
    return this.knowledgeService.uploadSource(user, id, {
      buffer: file.buffer,
      mimetype: file.mimetype,
      size: file.size,
      originalname: file.originalname,
    });
  }

  @Post('bases/:id/sources')
  @ApiOperation({ summary: 'Ajouter une source à une base' })
  @ApiParam({ name: 'id', description: 'ID de la base' })
  @ApiResponse({ status: 201, description: 'Source ajoutée' })
  addSource(
    @Request() req: ExpressRequest,
    @Param('id') id: string,
    @Body() dto: CreateKnowledgeSourceDto,
  ) {
    const user = req.user as CurrentUser;
    return this.knowledgeService.addSource(user, id, dto);
  }

  @Get('bases/:id/sources')
  @ApiOperation({ summary: 'Lister les sources d\'une base' })
  @ApiParam({ name: 'id', description: 'ID de la base' })
  @ApiResponse({ status: 200, description: 'Liste des sources' })
  listSources(@Request() req: ExpressRequest, @Param('id') id: string) {
    const user = req.user as CurrentUser;
    return this.knowledgeService.listSources(user, id);
  }

  @Delete('sources/:id')
  @ApiOperation({ summary: 'Supprimer une source' })
  @ApiParam({ name: 'id', description: 'ID de la source' })
  @ApiResponse({ status: 200, description: 'Source supprimée' })
  deleteSource(@Request() req: ExpressRequest, @Param('id') id: string) {
    const user = req.user as CurrentUser;
    return this.knowledgeService.deleteSource(user, id);
  }

  @Post('sources/:id/reindex')
  @ApiOperation({ summary: 'Déclencher la réindexation d\'une source' })
  @ApiParam({ name: 'id', description: 'ID de la source' })
  @ApiResponse({ status: 200, description: 'Réindexation déclenchée' })
  reindexSource(@Request() req: ExpressRequest, @Param('id') id: string) {
    const user = req.user as CurrentUser;
    return this.knowledgeService.reindexSource(user, id);
  }
}
