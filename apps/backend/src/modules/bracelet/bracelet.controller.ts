import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { BraceletService } from './bracelet.service';

@ApiTags('Bracelet')
@Controller('bracelet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BraceletController {
  constructor(private readonly braceletService: BraceletService) {}

  @Post('render')
  @ApiOperation({ summary: 'Génère une image PNG haute résolution du bracelet personnalisé' })
  @ApiResponse({ status: 200, description: 'Rendu généré avec succès' })
  async render(@Body() body: {
    text: string;
    font: string;
    fontSize: number;
    alignment: string;
    position: string;
    color: string;
    material: string;
    width?: number;
    height?: number;
    format?: 'png' | 'jpg';
  }) {
    return this.braceletService.renderBracelet(body);
  }
}
