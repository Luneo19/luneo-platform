import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClientDto {
  @ApiPropertyOptional({ description: 'Client/brand display name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Subscription plan', example: 'professional' })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional({ description: 'Account status', enum: ['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'])
  status?: string;
}
