import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFolderDto {
  @ApiProperty({
    description: 'Nom du dossier',
    example: 'Mes Images',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'ID du dossier parent (pour créer un sous-dossier)',
    example: 'folder_parent123',
  })
  @IsOptional()
  @IsString()
  parentId?: string;
}
