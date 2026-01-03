import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NormalizeTextDto {
  @ApiProperty({ description: 'Text to normalize' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ description: 'Also clean the text (remove control chars, normalize spaces)', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  clean?: boolean;
}






