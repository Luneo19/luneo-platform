import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ChurnRisk, LeadStatus } from '@prisma/client';

export class UpdateContactProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  aiProfile?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  leadStatus?: LeadStatus;

  @ApiPropertyOptional({ enum: ChurnRisk })
  @IsOptional()
  @IsEnum(ChurnRisk)
  churnRisk?: ChurnRisk;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  leadScore?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  segments?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;
}
