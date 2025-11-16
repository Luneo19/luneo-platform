import { Controller, Post, Body } from '@nestjs/common';
import { CustomMetricsService } from './custom-metrics.service';

interface ARConversionMetric {
  conversionType: string;
  durationSeconds: number;
  success: boolean;
  timestamp: number;
}

@Controller('metrics')
export class MetricsARController {
  constructor(private readonly customMetrics: CustomMetricsService) {}

  @Post('ar-conversion')
  async recordARConversion(@Body() data: ARConversionMetric): Promise<void> {
    if (data.success) {
      this.customMetrics.recordARConversion(
        data.conversionType,
        data.durationSeconds,
        true,
      );
    } else {
      this.customMetrics.recordARConversionError(
        data.conversionType,
        'conversion_failed',
      );
    }
  }
}
