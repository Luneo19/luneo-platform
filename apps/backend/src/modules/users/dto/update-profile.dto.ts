import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsUrlOrEmpty } from '@/libs/validation/validation-helpers';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Prénom', example: 'John', maxLength: 50 })
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName?: string;

  @ApiPropertyOptional({ description: 'Nom de famille', example: 'Doe', maxLength: 50 })
  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName?: string;

  @ApiPropertyOptional({ description: 'URL de l\'avatar', example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsUrlOrEmpty({ message: 'Avatar must be a valid URL or empty' })
  avatar?: string;

  @ApiPropertyOptional({ description: 'Téléphone', example: '+33612345678', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ description: 'Site web', example: 'https://example.com', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional({ description: 'Fuseau horaire', example: 'Europe/Paris', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;
}
