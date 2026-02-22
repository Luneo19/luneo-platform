import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class ChatStreamQueryDto {
  @ApiProperty({ description: 'User message for Luna' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'Conversation ID for context' })
  @IsOptional()
  @IsString()
  conversationId?: string;
}
