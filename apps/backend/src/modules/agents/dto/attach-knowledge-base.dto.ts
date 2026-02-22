import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AttachKnowledgeBaseDto {
  @ApiProperty({ description: 'ID de la base de connaissances à attacher' })
  @IsString()
  @IsNotEmpty()
  knowledgeBaseId: string;
}
