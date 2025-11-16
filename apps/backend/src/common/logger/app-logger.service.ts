import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context?: string;
  message: string;
  data?: Record<string, unknown>;
  userId?: string;
  requestId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly logDir: string;
  private readonly maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private readonly maxFiles: number = 10;
  private readonly isDevelopment: boolean;

  constructor(protected readonly configService: ConfigService) {
    this.isDevelopment = this.configService.get<string>('app.nodeEnv') === 'development';
    this.logDir = this.configService.get<string>('app.logDir') || path.join(process.cwd(), 'logs');

    // Créer le répertoire de logs s'il n'existe pas
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(message: string, context?: string, data?: Record<string, unknown>): void {
    this.writeLog(LogLevel.INFO, message, context, data);
  }

  error(
    message: string,
    trace?: string,
    context?: string,
    data?: Record<string, unknown>,
  ): void {
    const errorData = trace
      ? {
          ...data,
          error: {
            name: 'Error',
            message,
            stack: trace,
          },
        }
      : data;

    this.writeLog(LogLevel.ERROR, message, context, errorData);
  }

  warn(message: string, context?: string, data?: Record<string, unknown>): void {
    this.writeLog(LogLevel.WARN, message, context, data);
  }

  debug(message: string, context?: string, data?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      this.writeLog(LogLevel.DEBUG, message, context, data);
    }
  }

  verbose(message: string, context?: string, data?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      this.writeLog(LogLevel.DEBUG, message, context, data);
    }
  }

  protected writeLog(
    level: LogLevel,
    message: string,
    context?: string,
    data?: Record<string, unknown>,
  ): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data,
    };

    // Console output (format lisible)
    const consoleMessage = this.formatConsoleMessage(logEntry);
    this.writeToConsole(level, consoleMessage);

    // File output (JSON structuré)
    const fileMessage = JSON.stringify(logEntry) + '\n';
    this.writeToFile(level, fileMessage);
  }

  private formatConsoleMessage(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleString();
    const context = entry.context ? `[${entry.context}]` : '';
    const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
    const errorStr = entry.error ? `\n${entry.error.stack || entry.error.message}` : '';

    return `${timestamp} ${entry.level.toUpperCase()} ${context} ${entry.message}${dataStr}${errorStr}`;
  }

  private writeToConsole(level: LogLevel, message: string): void {
    switch (level) {
      case LogLevel.ERROR:
        console.error(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(message);
        }
        break;
      default:
        console.log(message);
    }
  }

  private writeToFile(level: LogLevel, message: string): void {
    const logFile = this.getLogFile(level);
    const logPath = path.join(this.logDir, logFile);

    try {
      // Vérifier la taille du fichier et le faire tourner si nécessaire
      if (fs.existsSync(logPath)) {
        const stats = fs.statSync(logPath);
        if (stats.size >= this.maxFileSize) {
          this.rotateLogFile(logPath, level);
        }
      }

      // Écrire dans le fichier
      fs.appendFileSync(logPath, message, 'utf8');
    } catch (error) {
      // En cas d'erreur d'écriture, on log seulement dans la console
      console.error(`Failed to write log to file: ${error}`);
    }
  }

  private getLogFile(level: LogLevel): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `${level}-${date}.log`;
  }

  private rotateLogFile(logPath: string, level: LogLevel): void {
    try {
      const dir = path.dirname(logPath);
      const baseName = path.basename(logPath, '.log');
      const ext = '.log';

      // Déplacer les anciens fichiers
      for (let i = this.maxFiles - 1; i >= 1; i--) {
        const oldFile = path.join(dir, `${baseName}.${i}${ext}`);
        const newFile = path.join(dir, `${baseName}.${i + 1}${ext}`);

        if (fs.existsSync(oldFile)) {
          if (i + 1 >= this.maxFiles) {
            // Supprimer le fichier le plus ancien
            fs.unlinkSync(oldFile);
          } else {
            fs.renameSync(oldFile, newFile);
          }
        }
      }

      // Renommer le fichier actuel
      const firstRotated = path.join(dir, `${baseName}.1${ext}`);
      fs.renameSync(logPath, firstRotated);
    } catch (error) {
      console.error(`Failed to rotate log file: ${error}`);
    }
  }

  /**
   * Nettoie les anciens fichiers de logs (appelé par un cron job)
   */
  cleanOldLogs(daysToKeep: number = 30): void {
    try {
      const files = fs.readdirSync(this.logDir);
      const now = Date.now();
      const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

      files.forEach((file) => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);

        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          this.log(`Deleted old log file: ${file}`, 'AppLoggerService');
        }
      });
    } catch (error) {
      console.error(`Failed to clean old logs: ${error}`);
    }
  }
}

