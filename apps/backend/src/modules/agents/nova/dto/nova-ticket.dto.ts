import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NovaTicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NovaTicketCategory {
  TECHNICAL = 'TECHNICAL',
  BILLING = 'BILLING',
  ACCOUNT = 'ACCOUNT',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  BUG = 'BUG',
  INTEGRATION = 'INTEGRATION',
  OTHER = 'OTHER',
}

/** POST /agents/nova/ticket */
export class NovaTicketDto {
  @ApiProperty({ description: 'Ticket subject', minLength: 1, maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  subject: string;

  @ApiProperty({ description: 'Ticket description', minLength: 1, maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  description: string;

  @ApiPropertyOptional({ description: 'Priority', enum: NovaTicketPriority, default: 'medium' })
  @IsEnum(NovaTicketPriority)
  @IsOptional()
  priority?: NovaTicketPriority;

  @ApiPropertyOptional({ description: 'User ID (UUID)' })
  @IsString()
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Brand ID (UUID)' })
  @IsString()
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Ticket category', enum: NovaTicketCategory })
  @IsEnum(NovaTicketCategory)
  @IsOptional()
  category?: NovaTicketCategory;
}
