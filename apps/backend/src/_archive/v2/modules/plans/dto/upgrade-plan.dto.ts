import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PlanTier } from '@/libs/plans';

export class UpgradePlanDto {
  @ApiProperty({
    description: 'Target user ID (admin must specify which user to upgrade)',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Target plan tier',
    enum: PlanTier,
  })
  @IsEnum(PlanTier)
  plan: PlanTier;
}
