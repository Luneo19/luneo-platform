import { IsString, IsEnum, IsOptional, IsArray, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority, TicketCategory } from '@prisma/client';

export class CreateTicketDto {
  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: TicketCategory })
  @IsEnum(TicketCategory)
  category: TicketCategory;

  @ApiProperty({ enum: TicketPriority, default: TicketPriority.MEDIUM })
  @IsEnum(TicketPriority)
  priority: TicketPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

