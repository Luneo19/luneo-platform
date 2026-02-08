import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCollectionDto {
  @ApiProperty({ description: 'Collection name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Collection description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether collection is public' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class UpdateCollectionDto {
  @ApiPropertyOptional({ description: 'Collection name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Collection description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether collection is public' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
