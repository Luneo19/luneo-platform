import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CustomizationService } from './customization.service';

@ApiTags('Customization')
@Controller('customization')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomizationController {
  constructor(private readonly customizationService: CustomizationService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Génère une personnalisation pour un produit' })
  @ApiResponse({ status: 200, description: 'Personnalisation générée avec succès' })
  async generate(@Body() body: {
    productId: string;
    zoneId: string;
    prompt: string;
    font?: string;
    color?: string;
    size?: number;
    effect?: 'normal' | 'embossed' | 'engraved' | '3d';
    zoneUV: { u: number[]; v: number[] };
    modelUrl: string;
  }) {
    return this.customizationService.generateCustomization(body);
  }
}
