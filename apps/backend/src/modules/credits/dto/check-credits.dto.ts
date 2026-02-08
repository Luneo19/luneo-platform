import { IsString, IsNumber, IsOptional, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckCreditsDto {
  @ApiProperty({ description: 'Endpoint or operation identifier to check credits for' })
  @IsString()
  @IsNotEmpty({ message: 'Endpoint is required' })
  endpoint: string;

  @ApiPropertyOptional({ description: 'Amount of credits to check (optional, endpoint default if omitted)', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;
}
