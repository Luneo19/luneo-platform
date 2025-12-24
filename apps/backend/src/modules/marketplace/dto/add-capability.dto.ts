import { IsString, IsObject, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddCapabilityDto {
  @ApiProperty({ description: 'Material name' })
  @IsString()
  @IsNotEmpty()
  material: string;

  @ApiProperty({ description: 'Technique name' })
  @IsString()
  @IsNotEmpty()
  technique: string;

  @ApiPropertyOptional({ description: 'Additional options' })
  @IsObject()
  @IsOptional()
  options?: Record<string, any>;
}




















