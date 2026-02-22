import {
  IsString,
  IsEmail,
  IsArray,
  IsOptional,
  ValidateNested,
  IsInt,
  Min,
  IsPhoneNumber,
  IsUrl,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressDto {
  @ApiProperty({ description: 'Street address' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'Postal code' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({ description: 'Country' })
  @IsString()
  @IsNotEmpty()
  country: string;
}

export class CreateArtisanDto {
  @ApiProperty({ description: 'Business name' })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiPropertyOptional({ description: 'Legal name' })
  @IsString()
  @IsOptional()
  legalName?: string;

  @ApiPropertyOptional({ description: 'Tax ID' })
  @IsString()
  @IsOptional()
  taxId?: string;

  @ApiPropertyOptional({ description: 'Address', type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  address?: AddressDto;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiProperty({ description: 'Supported materials', type: [String] })
  @IsArray()
  @IsString({ each: true })
  supportedMaterials: string[];

  @ApiProperty({ description: 'Supported techniques', type: [String] })
  @IsArray()
  @IsString({ each: true })
  supportedTechniques: string[];

  @ApiPropertyOptional({ description: 'Maximum volume capacity' })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxVolume?: number;

  @ApiPropertyOptional({ description: 'Average lead time in days' })
  @IsInt()
  @Min(1)
  @IsOptional()
  averageLeadTime?: number;

  @ApiPropertyOptional({ description: 'Minimum order value in cents' })
  @IsInt()
  @Min(0)
  @IsOptional()
  minOrderValue?: number;
}

































