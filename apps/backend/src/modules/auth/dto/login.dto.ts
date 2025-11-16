import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Email de l\'utilisateur' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Mot de passe' })
  @IsString()
  password!: string;
}
