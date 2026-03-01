import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  MinLength,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

export class CreateWebhookDto {
  @ApiProperty({ example: 'https://example.com/hooks/luneo' })
  @IsUrl({ require_tld: true })
  url!: string;

  @ApiProperty({ type: [String], example: ['public.message.created'] })
  @IsArray()
  @ArrayUnique()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  events!: string[];

  @ApiProperty({ example: 'whsec_xxx' })
  @IsString()
  @MinLength(16)
  secret!: string;

  @ApiPropertyOptional({
    example: { 'x-partner-id': 'partner_123' },
    description: 'Headers custom envoyes avec chaque webhook',
  })
  @IsOptional()
  @IsObject()
  customHeaders?: Record<string, string>;

  @ApiPropertyOptional({ minimum: 0, maximum: 10, default: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  maxRetries?: number;
}
