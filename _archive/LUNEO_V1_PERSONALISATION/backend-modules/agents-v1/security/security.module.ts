import { Module } from '@nestjs/common';
import { PromptInjectionDetectorService } from './prompt-injection-detector.service';
import { PIIDetectorService } from './pii-detector.service';
import { OutputSanitizerService } from './output-sanitizer.service';
import { ContentFilterService } from './content-filter.service';

const services = [
  PromptInjectionDetectorService,
  PIIDetectorService,
  OutputSanitizerService,
  ContentFilterService,
];

@Module({
  providers: services,
  exports: services,
})
export class AgentSecurityModule {}
