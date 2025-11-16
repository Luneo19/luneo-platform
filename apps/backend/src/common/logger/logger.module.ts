import { Module, Global } from '@nestjs/common';
import { AppLoggerService } from './app-logger.service';
import { CloudWatchLoggerService } from './cloudwatch-logger.service';
import { ScheduleModule } from '@nestjs/schedule';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [ScheduleModule],
  providers: [
    {
      provide: AppLoggerService,
      useFactory: (configService: ConfigService) => {
        const cloudwatchEnabled = configService.get<string>('app.cloudwatchEnabled') === 'true';
        
        if (cloudwatchEnabled) {
          return new CloudWatchLoggerService(configService);
        }
        
        return new AppLoggerService(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [AppLoggerService],
})
export class LoggerModule {
  constructor(private readonly logger: AppLoggerService) {}

  /**
   * Nettoie les anciens logs tous les jours à 2h du matin
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  handleLogCleanup() {
    this.logger.cleanOldLogs(30); // Garder 30 jours de logs
  }
}

