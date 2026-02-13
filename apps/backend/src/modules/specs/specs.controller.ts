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
import { RequestWithUserAndBrand } from '@/common/types/user.types';
import { ValidateSpecDto } from './dto/validate-spec.dto';
import { SpecsService } from './specs.service';
import { CreateSpecDto } from './dto/create-spec.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { BrandScopedGuard } from '@/common/guards/brand-scoped.guard';
import { BrandScoped } from '@/common/decorators/brand-scoped.decorator';
import { IdempotencyKey } from '@/common/decorators/idempotency-key.decorator';
import { IdempotencyGuard } from '@/common/guards/idempotency.guard';
import { IdempotencyInterceptor } from '@/common/interceptors/idempotency.interceptor';
import { UseInterceptors } from '@nestjs/common';

@ApiTags('specs')
@Controller('specs')
@UseGuards(JwtAuthGuard, BrandScopedGuard, IdempotencyGuard)
@UseInterceptors(IdempotencyInterceptor)
@ApiBearerAuth()
@BrandScoped()
export class SpecsController {
  constructor(private readonly specsService: SpecsService) {}

  @Post()
  @IdempotencyKey()
  @ApiOperation({ summary: 'Créer ou récupérer un DesignSpec (idempotent)' })
  @ApiResponse({ status: 201, description: 'Spec créé ou récupéré' })
  async createOrGet(
    @Body() dto: CreateSpecDto,
    @Request() req: RequestWithUserAndBrand,
  ) {
    return this.specsService.createOrGet(dto, req.brandId);
  }

  @Get(':specHash')
  @ApiOperation({ summary: 'Récupérer un spec par hash' })
  @ApiResponse({ status: 200, description: 'Spec trouvé' })
  async findByHash(
    @Param('specHash') specHash: string,
    @Request() req: RequestWithUserAndBrand,
  ) {
    return this.specsService.findByHash(specHash, req.brandId);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Valider un spec JSON' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  async validate(@Body() dto: ValidateSpecDto) {
    return this.specsService.validate(dto.spec);
  }
}

