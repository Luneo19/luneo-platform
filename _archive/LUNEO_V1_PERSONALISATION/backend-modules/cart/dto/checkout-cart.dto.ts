import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckoutCartDto {
  @ApiProperty({ description: 'Brand ID' })
  @IsString()
  brandId: string;
}
