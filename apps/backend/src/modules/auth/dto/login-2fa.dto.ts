import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Login2FADto {
  @ApiProperty({ example: 'temp_token_here', description: 'Token temporaire obtenu après login initial' })
  @IsString()
  @IsNotEmpty()
  tempToken: string;

  @ApiProperty({ example: '123456', description: 'Code TOTP à 6 chiffres' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  token: string;
}
