import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPurchaseDto {
  @ApiProperty({ description: 'Stripe Payment Intent ID for the purchase confirmation' })
  @IsString()
  @IsNotEmpty()
  stripePaymentIntentId: string;
}
