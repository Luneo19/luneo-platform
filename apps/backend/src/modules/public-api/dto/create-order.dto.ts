import { IsString, IsOptional, IsObject, IsUUID, IsNotEmpty, IsEmail, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ShippingAddressDto {
  @ApiProperty({ description: 'Street address' })
  @IsString()
  @IsNotEmpty()
  street!: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ description: 'Postal code' })
  @IsString()
  @IsNotEmpty()
  postalCode!: string;

  @ApiProperty({ description: 'Country' })
  @IsString()
  @IsNotEmpty()
  country!: string;

  @ApiPropertyOptional({ description: 'State or province' })
  @IsString()
  @IsOptional()
  state?: string;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Design ID to order' })
  @IsUUID()
  @IsNotEmpty()
  designId!: string;

  @ApiProperty({ description: 'Customer email address' })
  @IsEmail()
  @IsNotEmpty()
  customerEmail!: string;

  @ApiProperty({ description: 'Customer name' })
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @ApiProperty({ description: 'Shipping address' })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}


