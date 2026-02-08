import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessCreatorPayoutDto {
  @ApiProperty({ description: 'Stripe Connect account ID for the payout' })
  @IsString()
  @IsNotEmpty()
  stripeConnectAccountId: string;
}
