import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IsString, IsUrl, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { WebCrawlerService } from './web-crawler.service';
import { PersonaGeneratorService } from './persona-generator.service';

class CrawlUrlDto {
  @ApiProperty({ description: "URL du site à analyser", example: 'https://example.com' })
  @IsString()
  url: string;
}

class GeneratePersonaDto {
  @ApiProperty({ description: "URL du site à analyser", example: 'https://example.com' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ description: "Secteur d'activité (optionnel)", example: 'e-commerce' })
  @IsOptional()
  @IsString()
  industry?: string;
}

@ApiTags('web-crawler')
@Controller('web-crawler')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WebCrawlerController {
  constructor(
    private readonly crawlerService: WebCrawlerService,
    private readonly personaService: PersonaGeneratorService,
  ) {}

  @Post('crawl')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Analyser un site web et extraire les données" })
  @ApiResponse({ status: 200, description: 'Données du site extraites' })
  async crawlUrl(@Body() dto: CrawlUrlDto) {
    const result = await this.crawlerService.crawl(dto.url);
    return { data: result };
  }

  @Post('generate-persona')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Analyser un site et générer une persona d'agent IA" })
  @ApiResponse({ status: 200, description: 'Persona générée' })
  async generatePersona(@Body() dto: GeneratePersonaDto) {
    const crawlResult = await this.crawlerService.crawl(dto.url);
    if (dto.industry) {
      crawlResult.industry = dto.industry;
    }
    const persona = await this.personaService.generateFromCrawl(crawlResult);
    return {
      data: {
        crawl: {
          url: crawlResult.url,
          title: crawlResult.title,
          description: crawlResult.metaDescription,
          language: crawlResult.language,
          logoUrl: crawlResult.logoUrl,
        },
        persona,
      },
    };
  }
}
