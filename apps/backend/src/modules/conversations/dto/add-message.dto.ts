import { IsString, IsOptional, IsEnum, IsNotEmpty, IsJSON } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageRole } from '@prisma/client';

export class AddMessageDto {
  @ApiProperty({ description: 'Contenu du message' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Rôle de l\'émetteur', enum: MessageRole })
  @IsEnum(MessageRole)
  role: MessageRole;

  @ApiPropertyOptional({ description: 'Type de contenu (text, image, file...)' })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({ description: 'Pièces jointes (JSON)' })
  @IsOptional()
  attachments?: any;
}
