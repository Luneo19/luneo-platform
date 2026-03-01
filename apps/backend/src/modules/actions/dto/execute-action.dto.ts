import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class ExecuteActionDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  actionId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  agentId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  conversationId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;
}
