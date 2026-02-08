import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { BraceletService } from './bracelet.service';
import { RenderBraceletDto } from './dto/render-bracelet.dto';

@ApiTags('Bracelet')
@Controller('bracelet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BraceletController {
  constructor(private readonly braceletService: BraceletService) {}

  @Post('render')
  @ApiOperation({ summary: 'Génère une image PNG haute résolution du bracelet personnalisé' })
  @ApiResponse({ status: 200, description: 'Rendu généré avec succès' })
  async render(@Body() body: RenderBraceletDto) {
    return this.braceletService.renderBracelet(body);
  }
}
