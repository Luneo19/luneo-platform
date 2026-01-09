import {
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Put,
  Delete,
  Body,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request as ExpressRequest } from 'express';
import type * as multer from 'multer';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/types/user.types';

@ApiTags('users')
@Controller('users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtenir le profil de l\'utilisateur connecté' })
  @ApiResponse({
    status: 200,
    description: 'Profil utilisateur',
  })
  async getProfile(@Request() req: ExpressRequest & { user: CurrentUser }) {
    return this.usersService.findOne(req.user.id, req.user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Mettre à jour le profil utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Profil mis à jour',
  })
  async updateProfile(
    @Request() req: ExpressRequest & { user: CurrentUser },
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Get('me/quota')
  @ApiOperation({ summary: 'Obtenir le quota de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Quota utilisateur',
  })
  async getUserQuota(@Request() req: ExpressRequest & { user: CurrentUser }) {
    return this.usersService.getUserQuota(req.user.id);
  }

  @Get(':id')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Obtenir un utilisateur par ID (Admin seulement)' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur trouvé',
  })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async findOne(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: CurrentUser }
  ) {
    return this.usersService.findOne(id, req.user);
  }

  @Put('me/password')
  @ApiOperation({ summary: 'Changer le mot de passe' })
  @ApiResponse({ status: 200, description: 'Mot de passe changé avec succès' })
  async changePassword(
    @Request() req: ExpressRequest & { user: CurrentUser },
    @Body() body: { current_password: string; new_password: string }
  ) {
    return this.usersService.changePassword(req.user.id, body.current_password, body.new_password);
  }

  @Get('me/sessions')
  @ApiOperation({ summary: 'Récupérer toutes les sessions actives' })
  @ApiResponse({ status: 200, description: 'Sessions récupérées' })
  async getSessions(@Request() req: ExpressRequest & { user: CurrentUser }) {
    return this.usersService.getSessions(req.user.id);
  }

  @Delete('me/sessions/:id')
  @ApiOperation({ summary: 'Supprimer une session spécifique' })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({ status: 200, description: 'Session supprimée' })
  async deleteSession(
    @Param('id') sessionId: string,
    @Request() req: ExpressRequest & { user: CurrentUser }
  ) {
    return this.usersService.deleteSession(req.user.id, sessionId);
  }

  @Delete('me/sessions')
  @ApiOperation({ summary: 'Supprimer toutes les sessions sauf la actuelle' })
  @ApiQuery({ name: 'all', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Sessions supprimées' })
  async deleteAllSessions(
    @Query('all') all: string,
    @Request() req: ExpressRequest & { user: CurrentUser }
  ) {
    // Récupérer le token actuel depuis le header
    const currentTokenId = req.headers.authorization?.replace('Bearer ', '');
    return this.usersService.deleteAllSessions(req.user.id, currentTokenId);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Uploader un avatar' })
  @ApiResponse({ status: 200, description: 'Avatar uploadé avec succès' })
  async uploadAvatar(
    @UploadedFile() file: File,
    @Request() req: ExpressRequest & { user: CurrentUser }
  ) {
    return this.usersService.uploadAvatar(req.user.id, file);
  }

  @Delete('me/avatar')
  @ApiOperation({ summary: 'Supprimer l\'avatar' })
  @ApiResponse({ status: 200, description: 'Avatar supprimé avec succès' })
  async deleteAvatar(@Request() req: ExpressRequest & { user: CurrentUser }) {
    return this.usersService.deleteAvatar(req.user.id);
  }
}
