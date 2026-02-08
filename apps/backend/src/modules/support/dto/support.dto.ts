import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupportTicketDto {
  @ApiProperty({ description: 'Ticket subject' })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Ticket description/message' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Ticket priority' })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({ description: 'Ticket category' })
  @IsString()
  @IsOptional()
  category?: string;
}

export class UpdateSupportTicketDto {
  @ApiPropertyOptional({ description: 'Ticket status' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Ticket priority' })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({ description: 'Resolution note' })
  @IsString()
  @IsOptional()
  resolution?: string;
}
