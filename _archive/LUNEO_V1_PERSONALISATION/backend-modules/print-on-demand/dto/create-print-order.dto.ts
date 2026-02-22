import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, ValidateNested, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PrintOrderItemDto } from './print-order-item.dto';
import { ShippingAddressDto } from './shipping-address.dto';

export class CreatePrintOrderDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty()
  @IsString()
  brandId: string;

  @ApiProperty({ enum: ['printful', 'printify', 'gelato'] })
  @IsString()
  provider: string;

  @ApiProperty({ type: [PrintOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrintOrderItemDto)
  items: PrintOrderItemDto[];

  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiPropertyOptional({ description: 'Brand markup percentage (0-100)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  brandMarginPercent?: number;
}
