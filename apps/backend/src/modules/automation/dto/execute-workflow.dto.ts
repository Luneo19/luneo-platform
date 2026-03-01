import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class ExecuteWorkflowDto {
  @ApiProperty()
  @IsString()
  workflowId!: string;

  @ApiProperty()
  @IsString()
  agentId!: string;

  @ApiProperty()
  @IsString()
  conversationId!: string;

  @ApiProperty()
  @IsString()
  userMessage!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}
