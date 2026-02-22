import { IsString, IsOptional, IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartConversationDto {
  @ApiProperty({ description: 'ID du widget embarqué' })
  @IsString()
  @IsNotEmpty()
  widgetId: string;

  @ApiPropertyOptional({ description: 'Identifiant unique du visiteur' })
  @IsString()
  @IsOptional()
  visitorId?: string;

  @ApiPropertyOptional({ description: 'Email du visiteur' })
  @IsEmail()
  @IsOptional()
  visitorEmail?: string;

  @ApiPropertyOptional({ description: 'Nom du visiteur' })
  @IsString()
  @IsOptional()
  visitorName?: string;
}
