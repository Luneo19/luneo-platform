import { Global, Module } from '@nestjs/common';
import { LogSanitizerService } from './log-sanitizer.service';
import { SafeLoggerService } from './safe-logger.service';

@Global()
@Module({
  providers: [LogSanitizerService, SafeLoggerService],
  exports: [LogSanitizerService, SafeLoggerService],
})
export class LoggerModule {}

