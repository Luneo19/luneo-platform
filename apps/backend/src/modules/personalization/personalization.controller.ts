import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PersonalizationService } from './personalization.service';
import { ValidateZoneInputDto } from './dto/validate-zone-input.dto';
import { NormalizeTextDto } from './dto/normalize-text.dto';
import { AutoFitDto } from './dto/auto-fit.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { BrandScopedGuard } from '@/common/guards/brand-scoped.guard';
import { BrandScoped } from '@/common/decorators/brand-scoped.decorator';

@ApiTags('personalization')
@Controller('v1/personalization')
@UseGuards(JwtAuthGuard, BrandScopedGuard)
@ApiBearerAuth()
@BrandScoped()
export class PersonalizationController {
  constructor(private readonly personalizationService: PersonalizationService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Valider des inputs de zones' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  async validate(
    @Body() dto: ValidateZoneInputDto,
    @Request() req: any,
  ) {
    // Vérifier que le product appartient au brand
    // TODO: Ajouter vérification brandId
    return this.personalizationService.validateZoneInputs(dto);
  }

  @Post('normalize')
  @ApiOperation({ summary: 'Normaliser un texte Unicode' })
  @ApiResponse({ status: 200, description: 'Text normalized' })
  async normalize(@Body() dto: NormalizeTextDto) {
    return this.personalizationService.normalizeText(dto);
  }

  @Post('auto-fit')
  @ApiOperation({ summary: 'Calculer auto-fit pour un élément' })
  @ApiResponse({ status: 200, description: 'Auto-fit calculated' })
  async autoFit(@Body() dto: AutoFitDto) {
    return this.personalizationService.calculateAutoFit(dto);
  }
}

