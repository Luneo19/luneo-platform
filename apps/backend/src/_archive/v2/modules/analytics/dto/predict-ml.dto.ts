import { IsEnum, IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PredictMLDto {
  @ApiProperty({
    description: 'Prediction type',
    enum: ['churn', 'ltv', 'conversion', 'revenue'],
  })
  @IsEnum(['churn', 'ltv', 'conversion', 'revenue'])
  type: 'churn' | 'ltv' | 'conversion' | 'revenue';

  @ApiPropertyOptional({ description: 'User ID for user-level predictions' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Additional features for the model' })
  @IsOptional()
  @IsObject()
  features?: Record<string, unknown>;
}
