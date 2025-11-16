import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';

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
  async getProfile(@Req() req: Request) {
    const user = this.requireUser(req);
    return this.usersService.findOne(user.id, user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Mettre à jour le profil utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Profil mis à jour',
  })
  async updateProfile(@Req() req: Request, @Body() updateProfileDto: UpdateProfileDto) {
    const user = this.requireUser(req);
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Get('me/quota')
  @ApiOperation({ summary: 'Obtenir le quota de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Quota utilisateur',
  })
  async getUserQuota(@Req() req: Request) {
    const user = this.requireUser(req);
    return this.usersService.getUserQuota(user.id);
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
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const user = this.requireUser(req);
    return this.usersService.findOne(id, user);
  }

  private requireUser(req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    return req.user;
  }
}
