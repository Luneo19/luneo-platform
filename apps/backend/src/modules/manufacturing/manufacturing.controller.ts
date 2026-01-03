import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ManufacturingService } from './manufacturing.service';
import { GenerateExportPackDto } from './dto/generate-export-pack.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { BrandScopedGuard } from '@/common/guards/brand-scoped.guard';
import { BrandScoped } from '@/common/decorators/brand-scoped.decorator';

@ApiTags('manufacturing')
@Controller('v1/manufacturing')
@UseGuards(JwtAuthGuard, BrandScopedGuard)
@ApiBearerAuth()
@BrandScoped()
export class ManufacturingController {
  constructor(private readonly manufacturingService: ManufacturingService) {}

  @Post('export-pack')
  @ApiOperation({ summary: 'Générer un pack d\'export (SVG/DXF/PDF/ZIP)' })
  @ApiResponse({ status: 201, description: 'Export pack generated' })
  async generateExportPack(
    @Body() dto: GenerateExportPackDto,
    @Request() req: any,
  ) {
    // TODO: Vérifier que le snapshot appartient au brand
    return this.manufacturingService.generateExportPack(dto);
  }

  @Get('bundles/:orderId')
  @ApiOperation({ summary: 'Récupérer les bundles de production pour un order' })
  @ApiResponse({ status: 200, description: 'Production bundles' })
  async getProductionBundle(
    @Param('orderId') orderId: string,
    @Request() req: any,
  ) {
    // TODO: Vérifier que l'order appartient au brand
    return this.manufacturingService.getProductionBundle(orderId);
  }
}

