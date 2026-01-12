import { IsEmail, IsString, IsOptional, MinLength, IsEnum, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class SignupDto {
  @ApiProperty({ description: 'Email de l\'utilisateur', example: 'user@example.com' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @ApiProperty({ description: 'Mot de passe', minLength: 8, example: 'SecurePass123!' })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password!: string;

  @ApiProperty({ description: 'Prénom', example: 'John' })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName!: string;

  @ApiProperty({ description: 'Nom de famille', example: 'Doe' })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName!: string;

  @ApiPropertyOptional({ description: 'Rôle utilisateur', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be a valid UserRole enum value' })
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Token CAPTCHA pour vérification', example: '03AGdBq...' })
  @IsOptional()
  @IsString()
  captchaToken?: string;
}
