import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService, LogLevel, LogEntry } from './app-logger.service';
import * as AWS from 'aws-sdk';

/**
 * Service de logging avec intégration CloudWatch
 * 
 * Envoie les logs vers CloudWatch Logs en plus du système de fichiers local
 */
@Injectable()
export class CloudWatchLoggerService extends AppLoggerService {
  private cloudwatchLogs: AWS.CloudWatchLogs | null = null;
  private logGroupName: string;
  private logStreamName: string;
  private enabled: boolean;

  constructor(configService: ConfigService) {
    super(configService);
    
    this.enabled = configService.get<string>('app.cloudwatchEnabled') === 'true';
    this.logGroupName = configService.get<string>('app.cloudwatchLogGroup') || '/luneo/backend';
    this.logStreamName = configService.get<string>('app.cloudwatchLogStream') || 
      `backend-${new Date().toISOString().split('T')[0]}`;

    if (this.enabled) {
      this.initializeCloudWatch();
    }
  }

  private initializeCloudWatch(): void {
    try {
      const region = this.configService.get<string>('app.awsRegion') || 'eu-west-1';
      
      this.cloudwatchLogs = new AWS.CloudWatchLogs({
        region,
        // Les credentials sont chargées depuis les variables d'environnement AWS
        // AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
      });

      // Créer le log group s'il n'existe pas
      this.createLogGroupIfNotExists();
      
      // Créer le log stream
      this.createLogStream();
    } catch (error) {
      console.error('Failed to initialize CloudWatch:', error);
      this.enabled = false;
    }
  }

  private async createLogGroupIfNotExists(): Promise<void> {
    if (!this.cloudwatchLogs) return;

    try {
      await this.cloudwatchLogs
        .createLogGroup({ logGroupName: this.logGroupName })
        .promise();
    } catch (error: any) {
      // Ignorer l'erreur si le log group existe déjà
      if (error.code !== 'ResourceAlreadyExistsException') {
        console.error('Failed to create CloudWatch log group:', error);
      }
    }
  }

  private async createLogStream(): Promise<void> {
    if (!this.cloudwatchLogs) return;

    try {
      await this.cloudwatchLogs
        .createLogStream({
          logGroupName: this.logGroupName,
          logStreamName: this.logStreamName,
        })
        .promise();
    } catch (error: any) {
      // Ignorer l'erreur si le log stream existe déjà
      if (error.code !== 'ResourceAlreadyExistsException') {
        console.error('Failed to create CloudWatch log stream:', error);
      }
    }
  }

  protected override writeLog(
    level: LogLevel,
    message: string,
    context?: string,
    data?: Record<string, unknown>,
  ): void {
    // Appeler la méthode parente pour l'écriture locale
    super.writeLog(level, message, context, data);

    // Envoyer à CloudWatch si activé
    if (this.enabled && this.cloudwatchLogs) {
      this.sendToCloudWatch(level, message, context, data).catch((error) => {
        console.error('Failed to send log to CloudWatch:', error);
      });
    }
  }

  private async sendToCloudWatch(
    level: LogLevel,
    message: string,
    context?: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.cloudwatchLogs) return;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data,
    };

    const logEvent: AWS.CloudWatchLogs.Types.PutLogEventsRequest = {
      logGroupName: this.logGroupName,
      logStreamName: this.logStreamName,
      logEvents: [
        {
          message: JSON.stringify(logEntry),
          timestamp: Date.now(),
        },
      ],
    };

    try {
      await this.cloudwatchLogs.putLogEvents(logEvent).promise();
    } catch (error: any) {
      // Si le log stream n'existe pas, le créer et réessayer
      if (error.code === 'ResourceNotFoundException') {
        await this.createLogStream();
        await this.cloudwatchLogs.putLogEvents(logEvent).promise();
      } else {
        throw error;
      }
    }
  }

  /**
   * Envoie un batch de logs vers CloudWatch (pour optimisation)
   */
  async flushLogs(): Promise<void> {
    // À implémenter si nécessaire pour batch les logs
    // Pour l'instant, chaque log est envoyé individuellement
  }
}

