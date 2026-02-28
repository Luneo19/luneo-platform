import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ description: 'Contenu du message envoyé par le visiteur', minLength: 1, maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({ description: 'Jeton signé de conversation widget' })
  @IsString()
  @IsOptional()
  conversationToken?: string;
}
