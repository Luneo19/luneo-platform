import { IsString, IsNotEmpty, IsUrl, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const ZAPIER_TRIGGERS = ['new_design', 'new_order', 'new_subscription', 'design_updated'] as const;
export type ZapierTrigger = (typeof ZAPIER_TRIGGERS)[number];

export class ZapierSubscribeDto {
  @ApiProperty({ description: 'Webhook subscription URL (Zapier catch URL)', example: 'https://hooks.zapier.com/hooks/catch/123/abc/' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  targetUrl: string;

  @ApiProperty({ description: 'Event to subscribe to', enum: ZAPIER_TRIGGERS })
  @IsString()
  @IsIn(ZAPIER_TRIGGERS)
  event: ZapierTrigger;
}
