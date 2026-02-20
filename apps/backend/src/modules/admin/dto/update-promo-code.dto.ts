import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePromoCodeDto {
  @ApiProperty({ description: 'Whether the promo code is active and can be used' })
  @IsBoolean()
  active: boolean;
}
