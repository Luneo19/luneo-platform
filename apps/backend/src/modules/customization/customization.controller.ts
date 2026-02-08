import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CustomizationService } from './customization.service';
import { GenerateCustomizationDto } from './dto/generate-customization.dto';

@ApiTags('Customization')
@Controller('customization')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomizationController {
  constructor(private readonly customizationService: CustomizationService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Génère une personnalisation pour un produit' })
  @ApiResponse({ status: 200, description: 'Personnalisation générée avec succès' })
  async generate(@Body() body: GenerateCustomizationDto) {
    return this.customizationService.generateCustomization(body);
  }
}
