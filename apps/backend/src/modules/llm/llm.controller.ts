import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Roles } from '@/common/guards/roles.guard';
import { PlatformRole } from '@prisma/client';
import { LlmService } from '@/libs/llm/llm.service';

class TestCompletionDto {
  @ApiProperty({ description: 'Prompt à envoyer au modèle', example: 'Bonjour, comment ça va ?' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ description: 'Modèle à utiliser', example: 'gpt-4o-mini' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Température', example: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ description: 'Nombre max de tokens', example: 1024 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(16384)
  maxTokens?: number;
}

@ApiTags('llm')
@Controller('llm')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Get('models')
  @ApiOperation({ summary: 'Lister les modèles LLM disponibles' })
  @ApiResponse({ status: 200, description: 'Liste des modèles' })
  listModels() {
    return { models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'] };
  }

  @Post('complete')
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Tester une complétion (admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Résultat de la complétion' })
  async testCompletion(@Body() dto: TestCompletionDto) {
    const result = await this.llmService.complete({
      model: dto.model ?? 'gpt-4o-mini',
      messages: [{ role: 'user', content: dto.prompt }],
      temperature: dto.temperature ?? 0.7,
      maxTokens: dto.maxTokens ?? 1024,
    });

    return {
      content: result.content,
      model: result.model,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
    };
  }
}
