import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ChannelType, ScheduledMessageCreatedBy } from '@prisma/client';

export class CreateScheduledMessageDto {
  @ApiProperty({ description: 'Conversation cible (obligatoire)' })
  @IsString()
  conversationId!: string;

  @ApiPropertyOptional({ description: 'Contact cible si pas de conversation' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiProperty({ enum: ChannelType })
  @IsEnum(ChannelType)
  channelType!: ChannelType;

  @ApiProperty({ example: 'Bonjour, votre devis est pret.' })
  @IsString()
  @MaxLength(8000)
  content!: string;

  @ApiProperty({
    example: '2026-03-01T14:30:00.000Z',
    description: 'Datetime UTC planifiee',
  })
  @IsISO8601()
  scheduledAt!: string;

  @ApiPropertyOptional({ enum: ScheduledMessageCreatedBy, default: 'HUMAN' })
  @IsOptional()
  @IsEnum(ScheduledMessageCreatedBy)
  createdBy?: ScheduledMessageCreatedBy;
}
