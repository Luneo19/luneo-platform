import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export class PrintOrderItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsString()
  variantId: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ description: 'URL to the design file' })
  @IsUrl()
  designUrl: string;
}
