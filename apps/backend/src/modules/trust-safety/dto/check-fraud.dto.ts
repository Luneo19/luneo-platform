import { IsString, IsOptional, IsInt, Min, IsEnum, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckFraudDto {
  @ApiPropertyOptional({ description: 'User ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'IP address' })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Device fingerprint' })
  @IsString()
  @IsOptional()
  deviceFingerprint?: string;

  @ApiPropertyOptional({ description: 'Order value in cents' })
  @IsInt()
  @Min(0)
  @IsOptional()
  orderValue?: number;

  @ApiProperty({ description: 'Action type', enum: ['signup', 'login', 'order', 'payment'] })
  @IsEnum(['signup', 'login', 'order', 'payment'])
  actionType: 'signup' | 'login' | 'order' | 'payment';
}
































