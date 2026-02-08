import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PlanTier } from '@/libs/plans';

export class UpgradePlanDto {
  @ApiProperty({
    description: 'Target plan tier',
    enum: PlanTier,
  })
  @IsEnum(PlanTier)
  plan: PlanTier;
}
