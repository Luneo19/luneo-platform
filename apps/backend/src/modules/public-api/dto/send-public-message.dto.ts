import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class SendPublicMessageDto {
  @ApiProperty()
  @IsString()
  conversationId!: string;

  @ApiProperty({ maxLength: 8000 })
  @IsString()
  @MaxLength(8000)
  content!: string;
}
