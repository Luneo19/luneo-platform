import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RequestRefundDto {
  @ApiPropertyOptional({ description: 'Reason for the refund request', maxLength: 1000 })
  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Reason must not exceed 1000 characters' })
  reason?: string;
}
