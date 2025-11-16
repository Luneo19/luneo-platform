import { Controller, Get, Post } from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';
import type { FeatureFlagsResponseDto } from './dto/feature-flags.dto';
import { Public } from '@/common/decorators/public.decorator';

@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Public()
  @Get()
  getFlags(): FeatureFlagsResponseDto {
    return {
      updatedAt: this.featureFlagsService.getUpdatedAt(),
      flags: this.featureFlagsService.getAll(),
    };
  }

  @Post('reload')
  reload(): FeatureFlagsResponseDto {
    this.featureFlagsService.reload();
    return {
      updatedAt: this.featureFlagsService.getUpdatedAt(),
      flags: this.featureFlagsService.getAll(),
    };
  }
}

