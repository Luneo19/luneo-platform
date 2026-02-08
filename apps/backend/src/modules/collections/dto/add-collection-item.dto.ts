import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddCollectionItemDto {
  @ApiProperty({ description: 'ID of the design to add' })
  @IsString()
  @IsNotEmpty()
  designId: string;

  @ApiPropertyOptional({ description: 'Optional notes about the item' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
