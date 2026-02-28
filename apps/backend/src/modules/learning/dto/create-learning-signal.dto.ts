import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LearningSignalType } from '@prisma/client';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateLearningSignalDto {
  @ApiProperty()
  @IsString()
  conversationId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  messageId?: string;

  @ApiProperty({ enum: LearningSignalType })
  @IsEnum(LearningSignalType)
  signalType!: LearningSignalType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
