import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TimezoneInfo {
  timezone: string;
  offset: string;
  abbreviation: string;
  name: string;
}

@Injectable()
export class TimezoneService {
  private readonly logger = new Logger(TimezoneService.name);
  private readonly defaultTimezone = 'UTC';

  constructor(private readonly configService: ConfigService) {}

  /**
   * Get user's timezone from request headers or default
   */
  getUserTimezone(timezoneHeader?: string): string {
    if (timezoneHeader && this.isValidTimezone(timezoneHeader)) {
      return timezoneHeader;
    }
    return this.defaultTimezone;
  }

  /**
   * Convert date to user's timezone
   */
  toUserTimezone(date: Date, timezone: string = this.defaultTimezone): Date {
    try {
      // Create a date string in the target timezone
      const dateString = date.toLocaleString('en-US', { timeZone: timezone });
      return new Date(dateString);
    } catch (error) {
      this.logger.warn(`Invalid timezone ${timezone}, using UTC`);
      return date;
    }
  }

  /**
   * Convert date from user's timezone to UTC
   */
  fromUserTimezone(date: Date, timezone: string = this.defaultTimezone): Date {
    try {
      // Get the offset for the timezone
      const offset = this.getTimezoneOffset(timezone);
      const utcTime = date.getTime() - (offset * 60 * 1000);
      return new Date(utcTime);
    } catch (error) {
      this.logger.warn(`Invalid timezone ${timezone}, using UTC`);
      return date;
    }
  }

  /**
   * Format date with timezone
   */
  formatDateWithTimezone(
    date: Date,
    timezone: string = this.defaultTimezone,
    locale: string = 'en',
    options?: Intl.DateTimeFormatOptions
  ): string {
    try {
      return new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        ...options,
      }).format(date);
    } catch (error) {
      this.logger.warn(`Invalid timezone ${timezone}, using UTC`);
      return new Intl.DateTimeFormat(locale, {
        timeZone: 'UTC',
        ...options,
      }).format(date);
    }
  }

  /**
   * Get timezone information
   */
  getTimezoneInfo(timezone: string = this.defaultTimezone): TimezoneInfo {
    try {
      const date = new Date();
      const formatter = new Intl.DateTimeFormat('en', {
        timeZone: timezone,
        timeZoneName: 'short',
      });
      
      const parts = formatter.formatToParts(date);
      const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || 'UTC';
      
      const offset = this.getTimezoneOffset(timezone);
      const offsetString = this.formatOffset(offset);

      return {
        timezone,
        offset: offsetString,
        abbreviation: timeZoneName,
        name: this.getTimezoneName(timezone),
      };
    } catch (error) {
      this.logger.warn(`Invalid timezone ${timezone}, using UTC`);
      return {
        timezone: 'UTC',
        offset: '+00:00',
        abbreviation: 'UTC',
        name: 'Coordinated Universal Time',
      };
    }
  }

  /**
   * Get common timezones
   */
  getCommonTimezones(): Array<{ value: string; label: string; offset: string }> {
    return [
      { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: '+00:00' },
      { value: 'America/New_York', label: 'Eastern Time (ET)', offset: '-05:00' },
      { value: 'America/Chicago', label: 'Central Time (CT)', offset: '-06:00' },
      { value: 'America/Denver', label: 'Mountain Time (MT)', offset: '-07:00' },
      { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: '-08:00' },
      { value: 'Europe/London', label: 'London (GMT)', offset: '+00:00' },
      { value: 'Europe/Paris', label: 'Paris (CET)', offset: '+01:00' },
      { value: 'Europe/Berlin', label: 'Berlin (CET)', offset: '+01:00' },
      { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: '+09:00' },
      { value: 'Asia/Shanghai', label: 'Shanghai (CST)', offset: '+08:00' },
      { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: '+04:00' },
      { value: 'Australia/Sydney', label: 'Sydney (AEDT)', offset: '+11:00' },
    ];
  }

  /**
   * Check if timezone is valid
   */
  private isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get timezone offset in minutes
   */
  private getTimezoneOffset(timezone: string): number {
    try {
      const date = new Date();
      const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
      return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
    } catch {
      return 0;
    }
  }

  /**
   * Format offset as string
   */
  private formatOffset(offsetMinutes: number): string {
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    const minutes = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes >= 0 ? '+' : '-';
    return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  /**
   * Get timezone name
   */
  private getTimezoneName(timezone: string): string {
    const names: Record<string, string> = {
      'UTC': 'Coordinated Universal Time',
      'America/New_York': 'Eastern Time',
      'America/Chicago': 'Central Time',
      'America/Denver': 'Mountain Time',
      'America/Los_Angeles': 'Pacific Time',
      'Europe/London': 'Greenwich Mean Time',
      'Europe/Paris': 'Central European Time',
      'Europe/Berlin': 'Central European Time',
      'Asia/Tokyo': 'Japan Standard Time',
      'Asia/Shanghai': 'China Standard Time',
      'Asia/Dubai': 'Gulf Standard Time',
      'Australia/Sydney': 'Australian Eastern Daylight Time',
    };
    return names[timezone] || timezone;
  }
}

