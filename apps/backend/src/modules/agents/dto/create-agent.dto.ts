import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsBoolean,
  IsEmail,
  IsObject,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AgentTone } from '@prisma/client';

export class CreateAgentDto {
  @ApiProperty({ description: 'Agent name', example: 'Support Agent' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Agent description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Template ID to base the agent on' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'AI model', default: 'gpt-4o-mini' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Temperature (0-2)', default: 0.3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ description: 'Agent tone', enum: AgentTone })
  @IsOptional()
  @IsEnum(AgentTone)
  tone?: AgentTone;

  @ApiPropertyOptional({ description: 'Supported languages', default: ['fr'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({ description: 'Greeting message' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  greeting?: string;

  @ApiPropertyOptional({ description: 'System prompt for the agent', maxLength: 10000 })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  systemPrompt?: string;

  @ApiPropertyOptional({ description: 'Custom instructions', maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  customInstructions?: string;

  @ApiPropertyOptional({ description: 'Max tokens per reply', default: 1000, minimum: 100, maximum: 4000 })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(4000)
  maxTokensPerReply?: number;

  @ApiPropertyOptional({ description: 'Enable auto-escalation' })
  @IsOptional()
  @IsBoolean()
  autoEscalate?: boolean;

  @ApiPropertyOptional({ description: 'Confidence threshold (0-1)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceThreshold?: number;

  @ApiPropertyOptional({ description: 'Email for escalation' })
  @IsOptional()
  @IsEmail()
  escalationEmail?: string;

  @ApiPropertyOptional({ description: 'Fallback message when agent cannot respond' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  fallbackMessage?: string;

  @ApiPropertyOptional({ description: 'Context window size' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  contextWindow?: number;

  @ApiPropertyOptional({ description: 'Business hours configuration (JSON)' })
  @IsOptional()
  @IsObject()
  businessHours?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Enable conversation memory' })
  @IsOptional()
  @IsBoolean()
  enableMemory?: boolean;

  @ApiPropertyOptional({ description: 'Enable sentiment analysis' })
  @IsOptional()
  @IsBoolean()
  enableSentiment?: boolean;
}
