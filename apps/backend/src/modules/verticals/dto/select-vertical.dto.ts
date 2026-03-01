import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class SelectVerticalDto {
  @ApiProperty({ example: 'ecommerce' })
  @IsString()
  @MaxLength(64)
  slug!: string;

  @ApiProperty({ required: false, description: 'Overrides specifique organisation' })
  @IsOptional()
  @IsObject()
  onboardingData?: Record<string, unknown>;
}
