import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCreditPackDto {
  @ApiProperty({ description: 'Pack name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Number of credits in the pack', minimum: 1 })
  @IsNumber()
  @Min(1)
  credits: number;

  @ApiProperty({ description: 'Price in cents (e.g. 999 = €9.99)', minimum: 0 })
  @IsNumber()
  @Min(0)
  priceCents: number;

  @ApiPropertyOptional({ description: 'Stripe Price ID for checkout' })
  @IsString()
  @IsOptional()
  stripePriceId?: string;

  @ApiPropertyOptional({ description: 'Whether the pack is available for purchase', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Display description / badge text (e.g. "Best Value")' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Bonus credits (display only; not in DB)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  bonusCredits?: number;

  @ApiPropertyOptional({ description: 'Whether to feature this pack', default: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Savings percentage vs base pack' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  savings?: number;

  @ApiPropertyOptional({ description: 'Badge label (e.g. "Best Value", "Most Popular")' })
  @IsString()
  @IsOptional()
  badge?: string;
}
