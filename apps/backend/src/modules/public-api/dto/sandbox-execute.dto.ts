import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class SandboxExecuteDto {
  @ApiProperty({ example: 'Bonjour, peux-tu m aider a choisir un plan?' })
  @IsString()
  @MaxLength(5000)
  message!: string;
}
