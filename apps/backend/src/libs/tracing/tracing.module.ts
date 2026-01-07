import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenTelemetryService } from './opentelemetry.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [OpenTelemetryService],
  exports: [OpenTelemetryService],
})
export class TracingModule {}
































