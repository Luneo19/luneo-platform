import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelOrderDto {
  @ApiPropertyOptional({ description: 'Reason for cancelling the order', maxLength: 1000 })
  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Reason must not exceed 1000 characters' })
  reason?: string;
}
