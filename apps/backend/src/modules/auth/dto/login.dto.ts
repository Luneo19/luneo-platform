import { IsEmail, IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Email de l\'utilisateur', example: 'user@example.com' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ description: 'Mot de passe', example: 'SecurePass123!' })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiPropertyOptional({ description: 'Rester connecté (session longue durée)', example: true })
  @IsOptional()
  @IsBoolean({ message: 'rememberMe must be a boolean' })
  rememberMe?: boolean;
}
