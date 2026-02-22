import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDto {
  @ApiProperty({ description: 'Street line 1' })
  @IsString()
  line1!: string;

  @ApiPropertyOptional({ description: 'Street line 2' })
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  city!: string;

  @ApiPropertyOptional({ description: 'State / region' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ description: 'Postal code' })
  @IsString()
  postalCode!: string;

  @ApiProperty({ description: 'Country code (ISO 3166-1 alpha-2)' })
  @IsString()
  country!: string;
}

export class PackageDto {
  @ApiProperty({ description: 'Weight in kg' })
  @IsNumber()
  @Min(0)
  weightKg!: number;

  @ApiPropertyOptional({ description: 'Length in cm' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lengthCm?: number;

  @ApiPropertyOptional({ description: 'Width in cm' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  widthCm?: number;

  @ApiPropertyOptional({ description: 'Height in cm' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  heightCm?: number;
}

export class GetRatesDto {
  @ApiProperty({ description: 'Origin address' })
  @ValidateNested()
  @Type(() => AddressDto)
  origin!: AddressDto;

  @ApiProperty({ description: 'Destination address' })
  @ValidateNested()
  @Type(() => AddressDto)
  destination!: AddressDto;

  @ApiProperty({ description: 'Packages', type: [PackageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageDto)
  packages!: PackageDto[];

  @ApiPropertyOptional({ description: 'Preferred carrier' })
  @IsOptional()
  @IsString()
  carrier?: string;
}

export class CreateShipmentDto {
  @ApiProperty({ description: 'Carrier / service level ID from getRates' })
  @IsString()
  rateId!: string;

  @ApiProperty({ description: 'Origin address' })
  @ValidateNested()
  @Type(() => AddressDto)
  origin!: AddressDto;

  @ApiProperty({ description: 'Destination address' })
  @ValidateNested()
  @Type(() => AddressDto)
  destination!: AddressDto;

  @ApiProperty({ description: 'Packages', type: [PackageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageDto)
  packages!: PackageDto[];

  @ApiPropertyOptional({ description: 'Reference (e.g. order ID)' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: 'Metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class ValidateAddressDto {
  @ApiProperty({ description: 'Address to validate' })
  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;
}
