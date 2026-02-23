import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TrackEventDto } from './track-event.dto';

/**
 * Request body for track event endpoint.
 * Accepts either a single event (object) or a batch of events ({ events: TrackEventDto[] }).
 */
export class TrackEventRequestDto extends TrackEventDto {
  @ApiPropertyOptional({
    description: 'Array of events (batch format). When present, the body is treated as batch.',
    type: [TrackEventDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackEventDto)
  events?: TrackEventDto[];
}
