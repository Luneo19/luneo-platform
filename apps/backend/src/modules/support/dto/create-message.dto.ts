import { IsString, IsEnum, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '@prisma/client';

export class CreateMessageDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ enum: MessageType, default: MessageType.USER })
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}

