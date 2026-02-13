import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class ShippingAddressDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  @MinLength(1)
  address1: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address2?: string;

  @ApiProperty({ example: 'Paris' })
  @IsString()
  @MinLength(1)
  city: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: 'FR' })
  @IsString()
  @MinLength(1)
  country: string;

  @ApiProperty({ example: '75001' })
  @IsString()
  @MinLength(1)
  zip: string;
}
