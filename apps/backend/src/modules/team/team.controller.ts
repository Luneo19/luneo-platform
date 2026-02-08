import {
  Controller,
  Get,
  Post,
  Put,
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
import { TeamService } from './team.service';
import { UpdateTeamMemberDto } from './dto/team.dto';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('team')
@Controller('team')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les membres de l\'équipe' })
  @ApiResponse({ status: 200, description: 'Liste des membres' })
  async findAll(@Request() req) {
    return this.teamService.findAll(req.user.brandId || req.user.id);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Inviter un nouveau membre' })
  @ApiResponse({ status: 201, description: 'Invitation créée' })
  async invite(@Body() inviteDto: InviteTeamMemberDto, @Request() req) {
    return this.teamService.invite(inviteDto, req.user.brandId || req.user.id, req.user.id);
  }

  @Get('invite')
  @ApiOperation({ summary: 'Lister toutes les invitations' })
  @ApiResponse({ status: 200, description: 'Liste des invitations' })
  async getInvites(@Request() req) {
    return this.teamService.getInvites(req.user.brandId || req.user.id);
  }

  @Delete('invite/:id')
  @ApiOperation({ summary: 'Annuler une invitation' })
  @ApiParam({ name: 'id', description: 'ID de l\'invitation' })
  @ApiResponse({ status: 200, description: 'Invitation annulée' })
  async cancelInvite(@Param('id') id: string, @Request() req) {
    return this.teamService.cancelInvite(id, req.user.brandId || req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un membre d\'équipe' })
  @ApiParam({ name: 'id', description: 'ID du membre' })
  @ApiResponse({ status: 200, description: 'Détails du membre' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.teamService.findOne(id, req.user.brandId || req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un membre d\'équipe' })
  @ApiParam({ name: 'id', description: 'ID du membre' })
  @ApiResponse({ status: 200, description: 'Membre mis à jour' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateTeamMemberDto, @Request() req) {
    return this.teamService.update(id, updateDto, req.user.brandId || req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un membre d\'équipe' })
  @ApiParam({ name: 'id', description: 'ID du membre' })
  @ApiResponse({ status: 200, description: 'Membre supprimé' })
  async delete(@Param('id') id: string, @Request() req) {
    return this.teamService.delete(id, req.user.brandId || req.user.id, req.user.id);
  }
}
