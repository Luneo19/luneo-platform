import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Verify2FADto {
  @ApiProperty({ example: '123456', description: 'Code TOTP à 6 chiffres' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  token: string;
}
