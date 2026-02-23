import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSLATicketStatusDto {
  @ApiPropertyOptional({ description: 'ISO 8601 date when first response was sent' })
  @IsOptional()
  @IsString()
  @IsDateString()
  firstResponseAt?: string;

  @ApiPropertyOptional({ description: 'ISO 8601 date when ticket was resolved' })
  @IsOptional()
  @IsString()
  @IsDateString()
  resolvedAt?: string;
}
