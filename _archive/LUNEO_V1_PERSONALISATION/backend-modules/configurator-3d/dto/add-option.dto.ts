import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Configurator3DOptionType } from '@prisma/client';

export class AddOptionDto {
  @ApiProperty({
    description: 'Nom de l\'option (identifiant technique)',
    example: 'color',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Type d\'option',
    enum: Configurator3DOptionType,
    example: Configurator3DOptionType.COLOR,
  })
  @IsEnum(Configurator3DOptionType)
  type: Configurator3DOptionType;

  @ApiProperty({
    description: 'Label affiché à l\'utilisateur',
    example: 'Couleur',
  })
  @IsString()
  label: string;

  @ApiPropertyOptional({
    description: 'Description de l\'option',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Valeur par défaut',
    example: { value: '#000000' },
  })
  @IsOptional()
  @IsObject()
  defaultValue?: Record<string, unknown>;

  @ApiProperty({
    description: 'Valeurs disponibles',
    example: {
      options: [
        { value: '#000000', label: 'Noir' },
        { value: '#FFFFFF', label: 'Blanc' },
      ],
    },
  })
  @IsObject()
  values: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Contraintes de validation',
    example: { min: 0, max: 100 },
  })
  @IsOptional()
  @IsObject()
  constraints?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Ordre d\'affichage',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({
    description: 'Option requise',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}
