import { IsString, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateZoneInputDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Zone inputs (zoneId -> input)' })
  @IsObject()
  @IsNotEmpty()
  zoneInputs: Record<string, {
    text?: string;
    font?: string;
    color?: string;
    size?: number;
    effect?: string;
    orientation?: string;
    [key: string]: any;
  }>;
}










