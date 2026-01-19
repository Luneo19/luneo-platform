import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';

export enum EventType {
  PAGE_VIEW = 'page_view',
  CONVERSION = 'conversion',
  USER_ACTION = 'user_action',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
}

export class TrackEventDto {
  @ApiProperty({
    description: 'Type of event',
    enum: EventType,
    example: EventType.PAGE_VIEW,
  })
  @IsEnum(EventType)
  eventType: EventType;

  @ApiProperty({
    description: 'Session ID',
    required: false,
    example: 'session_123',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiProperty({
    description: 'Event properties (flexible JSON object)',
    required: false,
    example: { path: '/dashboard', referrer: 'https://google.com' },
  })
  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;
}
