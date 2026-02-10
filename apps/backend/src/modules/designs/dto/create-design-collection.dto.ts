import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDesignCollectionDto {
  @ApiProperty({ description: 'Collection name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Collection description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ description: 'Whether collection is public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
