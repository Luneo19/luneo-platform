import { IsString, IsOptional, IsIn, IsBoolean, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AddOnItem {
  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;
}

export class CreateCheckoutSessionDto {
  @ApiProperty({ description: 'Plan ID' })
  @IsString()
  planId: string;

  @ApiPropertyOptional({ description: 'Customer email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ enum: ['monthly', 'yearly'] })
  @IsOptional()
  @IsIn(['monthly', 'yearly'])
  billingInterval?: 'monthly' | 'yearly';

  @ApiPropertyOptional({ type: [AddOnItem] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddOnItem)
  addOns?: AddOnItem[];

  @ApiPropertyOptional({ description: 'Country code for currency detection (e.g. CH, DE)' })
  @IsOptional()
  @IsString()
  country?: string;
}

export class AddPaymentMethodDto {
  @ApiProperty({ description: 'Stripe payment method ID' })
  @IsString()
  paymentMethodId: string;

  @ApiPropertyOptional({ description: 'Set as default payment method' })
  @IsOptional()
  @IsBoolean()
  setAsDefault?: boolean;
}

export class ChangePlanDto {
  @ApiProperty({ description: 'New plan ID' })
  @IsString()
  planId: string;

  @ApiPropertyOptional({ enum: ['monthly', 'yearly'] })
  @IsOptional()
  @IsIn(['monthly', 'yearly'])
  billingInterval?: 'monthly' | 'yearly';

  @ApiPropertyOptional({ description: 'Apply immediately' })
  @IsOptional()
  @IsBoolean()
  immediateChange?: boolean;
}

export class CancelSubscriptionDto {
  @ApiPropertyOptional({ description: 'Cancel immediately' })
  @IsOptional()
  @IsBoolean()
  immediate?: boolean;
}
