import { IsString, IsNumber, IsOptional, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddCreditsDto {
  @ApiProperty({ description: 'User ID to add credits to' })
  @IsString()
  @IsNotEmpty({ message: 'UserId is required' })
  userId: string;

  @ApiProperty({ description: 'Amount of credits to add', minimum: 1 })
  @IsNumber()
  @Min(1, { message: 'Amount must be at least 1' })
  amount: number;

  @ApiPropertyOptional({ description: 'Credit pack ID (optional)' })
  @IsString()
  @IsOptional()
  packId?: string;

  @ApiPropertyOptional({ description: 'Stripe session ID (optional)' })
  @IsString()
  @IsOptional()
  stripeSessionId?: string;

  @ApiPropertyOptional({ description: 'Stripe payment ID (optional)' })
  @IsString()
  @IsOptional()
  stripePaymentId?: string;
}
