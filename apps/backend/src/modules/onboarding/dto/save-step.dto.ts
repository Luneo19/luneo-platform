import { IsInt, Min, Max, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaveStepDto {
  @ApiProperty({ minimum: 1, maximum: 5, example: 1 })
  @IsInt()
  @Min(1)
  @Max(5)
  stepNumber: number;

  @ApiPropertyOptional({ description: 'Step payload (profile, industry slug, use cases, goals, integrations)' })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
