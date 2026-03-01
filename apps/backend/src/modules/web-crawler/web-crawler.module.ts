import { Module } from '@nestjs/common';
import { WebCrawlerService } from './web-crawler.service';
import { PersonaGeneratorService } from './persona-generator.service';
import { WebCrawlerController } from './web-crawler.controller';

@Module({
  controllers: [WebCrawlerController],
  providers: [WebCrawlerService, PersonaGeneratorService],
  exports: [WebCrawlerService, PersonaGeneratorService],
})
export class WebCrawlerModule {}
