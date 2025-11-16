import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDto {
  @ApiProperty({ example: 'Jane' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @ApiPropertyOptional({ example: 'Luneo' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  company?: string;

  @ApiProperty({ example: '10 Rue de la République' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address1!: string;

  @ApiPropertyOptional({ example: 'Bâtiment B' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address2?: string;

  @ApiProperty({ example: 'Paris' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  city!: string;

  @ApiPropertyOptional({ example: 'Ile-de-France' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @ApiProperty({ example: '75001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postalCode!: string;

  @ApiProperty({ example: 'FR' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2)
  country!: string;

  @ApiPropertyOptional({ example: '+33123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Design à produire', format: 'uuid' })
  @IsUUID()
  designId!: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  customerEmail!: string;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  customerName?: string;

  @ApiPropertyOptional({ example: '+33123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  customerPhone?: string;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress!: AddressDto;

  @ApiPropertyOptional({ description: 'Quantité commandée', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity?: number;
}

