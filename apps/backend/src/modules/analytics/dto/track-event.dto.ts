import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsEnum, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export enum EventType {
  PAGE_VIEW = 'page_view',
  CONVERSION = 'conversion',
  USER_ACTION = 'user_action',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
}

/**
 * Single event DTO - accepts both backend-native and frontend formats.
 * Frontend sends: { category, action, label, metadata, ... }
 * Backend expects: { eventType, properties }
 * We accept all fields and normalize in the controller.
 */
export class TrackEventDto {
  @ApiProperty({
    description: 'Type of event (backend format)',
    enum: EventType,
    required: false,
    example: EventType.PAGE_VIEW,
  })
  @IsOptional()
  @IsEnum(EventType)
  eventType?: EventType;

  @ApiProperty({
    description: 'Event category (frontend format, maps to eventType)',
    required: false,
    example: 'page_view',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    description: 'Event action (frontend format)',
    required: false,
    example: 'page_enter',
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiProperty({
    description: 'Event label (frontend format)',
    required: false,
    example: '/dashboard',
  })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({
    description: 'Session ID',
    required: false,
    example: 'session_123',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiProperty({
    description: 'User ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'Event properties (flexible JSON object)',
    required: false,
    example: { path: '/dashboard', referrer: 'https://google.com' },
  })
  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;

  @ApiProperty({
    description: 'Event metadata (frontend format, maps to properties)',
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsNumber()
  timestamp?: number;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  referrer?: string;
}

/**
 * Batch events DTO - accepts { events: TrackEventDto[] }
 * This is the format the frontend AnalyticsService.flush() sends.
 */
export class TrackEventsBatchDto {
  @ApiProperty({
    description: 'Array of events to track',
    type: [TrackEventDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackEventDto)
  events: TrackEventDto[];
}
