import { IsString, IsObject, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StoneDto {
  @ApiProperty({ description: 'Stone type' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Stone size in mm' })
  @IsNumber()
  @IsNotEmpty()
  size: number;

  @ApiProperty({ description: 'Stone position', type: 'object' })
  @IsObject()
  position: { x: number; y: number; z: number };
}

export class SettingDto {
  @ApiProperty({ description: 'Setting type', enum: ['claw', 'pave', 'channel', 'bezel'] })
  @IsEnum(['claw', 'pave', 'channel', 'bezel'])
  type: 'claw' | 'pave' | 'channel' | 'bezel';

  @ApiPropertyOptional({ description: 'Setting parameters' })
  @IsObject()
  @IsOptional()
  parameters?: Record<string, any>;
}

export class ParametersDto {
  @ApiPropertyOptional({ description: 'Ring size' })
  @IsNumber()
  @IsOptional()
  ringSize?: number;

  @ApiPropertyOptional({ description: 'Metal type' })
  @IsString()
  @IsOptional()
  metal?: string;

  @ApiPropertyOptional({ description: 'Thickness in mm' })
  @IsNumber()
  @IsOptional()
  thickness?: number;

  @ApiPropertyOptional({ description: 'Stones', type: [StoneDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoneDto)
  @IsOptional()
  stones?: StoneDto[];

  @ApiPropertyOptional({ description: 'Setting', type: SettingDto })
  @ValidateNested()
  @Type(() => SettingDto)
  @IsOptional()
  setting?: SettingDto;
}

export class GeometricConstraintsDto {
  @ApiPropertyOptional({ description: 'Minimum thickness in mm' })
  @IsNumber()
  @IsOptional()
  minThickness?: number;

  @ApiPropertyOptional({ description: 'Maximum thickness in mm' })
  @IsNumber()
  @IsOptional()
  maxThickness?: number;

  @ApiPropertyOptional({ description: 'Minimum radius in mm' })
  @IsNumber()
  @IsOptional()
  minRadius?: number;

  @ApiPropertyOptional({ description: 'Maximum weight in g' })
  @IsNumber()
  @IsOptional()
  maxWeight?: number;

  @ApiPropertyOptional({ description: 'Minimum ring size (US)' })
  @IsNumber()
  @IsOptional()
  minRingSize?: number;

  @ApiPropertyOptional({ description: 'Maximum ring size (US)' })
  @IsNumber()
  @IsOptional()
  maxRingSize?: number;
}

export class SettingConstraintsDto {
  @ApiPropertyOptional({ description: 'Minimum claw thickness in mm' })
  @IsNumber()
  @IsOptional()
  minClawThickness?: number;

  @ApiPropertyOptional({ description: 'Minimum pave spacing in mm' })
  @IsNumber()
  @IsOptional()
  minPaveSpacing?: number;

  @ApiPropertyOptional({ description: 'Maximum stone size in mm' })
  @IsNumber()
  @IsOptional()
  maxStoneSize?: number;

  @ApiPropertyOptional({ description: 'Minimum stone size in mm' })
  @IsNumber()
  @IsOptional()
  minStoneSize?: number;
}

export class CollisionConstraintsDto {
  @ApiPropertyOptional({ description: 'Check stone-claw collision' })
  @IsOptional()
  checkStoneClawCollision?: boolean;

  @ApiPropertyOptional({ description: 'Check stone-stone collision' })
  @IsOptional()
  checkStoneStoneCollision?: boolean;

  @ApiPropertyOptional({ description: 'Minimum clearance in mm' })
  @IsNumber()
  @IsOptional()
  minClearance?: number;
}

export class ConstraintsDto {
  @ApiPropertyOptional({ description: 'Geometric constraints', type: GeometricConstraintsDto })
  @ValidateNested()
  @Type(() => GeometricConstraintsDto)
  @IsOptional()
  geometric?: GeometricConstraintsDto;

  @ApiPropertyOptional({ description: 'Setting constraints', type: SettingConstraintsDto })
  @ValidateNested()
  @Type(() => SettingConstraintsDto)
  @IsOptional()
  setting?: SettingConstraintsDto;

  @ApiPropertyOptional({ description: 'Collision constraints', type: CollisionConstraintsDto })
  @ValidateNested()
  @Type(() => CollisionConstraintsDto)
  @IsOptional()
  collision?: CollisionConstraintsDto;
}

export class ValidateCADDto {
  @ApiProperty({ description: 'Design ID' })
  @IsString()
  designId: string;

  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Design parameters', type: ParametersDto })
  @ValidateNested()
  @Type(() => ParametersDto)
  parameters: ParametersDto;

  @ApiProperty({ description: 'Validation constraints', type: ConstraintsDto })
  @ValidateNested()
  @Type(() => ConstraintsDto)
  constraints: ConstraintsDto;
}
































