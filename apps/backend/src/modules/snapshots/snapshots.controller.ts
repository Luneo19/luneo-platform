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
import { SnapshotsService } from './snapshots.service';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { BrandScopedGuard } from '@/common/guards/brand-scoped.guard';
import { BrandScoped } from '@/common/decorators/brand-scoped.decorator';
import { IdempotencyKey } from '@/common/decorators/idempotency-key.decorator';
import { IdempotencyGuard } from '@/common/guards/idempotency.guard';
import { IdempotencyInterceptor } from '@/common/interceptors/idempotency.interceptor';
import { UseInterceptors } from '@nestjs/common';

@ApiTags('snapshots')
@Controller('snapshots')
@UseGuards(JwtAuthGuard, BrandScopedGuard, IdempotencyGuard)
@UseInterceptors(IdempotencyInterceptor)
@ApiBearerAuth()
@BrandScoped()
export class SnapshotsController {
  constructor(private readonly snapshotsService: SnapshotsService) {}

  @Post()
  @IdempotencyKey()
  @ApiOperation({ summary: 'Créer un snapshot (idempotent)' })
  @ApiResponse({ status: 201, description: 'Snapshot créé' })
  async create(
    @Body() dto: CreateSnapshotDto,
    @Request() req: RequestWithUserAndBrand,
  ) {
    return this.snapshotsService.create(dto, req.brandId, req.user?.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un snapshot' })
  @ApiResponse({ status: 200, description: 'Snapshot trouvé' })
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUserAndBrand,
  ) {
    return this.snapshotsService.findOne(id, req.brandId);
  }

  @Post(':id/lock')
  @ApiOperation({ summary: 'Verrouiller un snapshot' })
  @ApiResponse({ status: 200, description: 'Snapshot verrouillé' })
  async lock(
    @Param('id') id: string,
    @Request() req: RequestWithUserAndBrand,
  ) {
    return this.snapshotsService.lock(id, req.brandId, req.user.id);
  }
}

