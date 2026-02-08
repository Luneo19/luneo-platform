import { IsNumber, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BuyCreditsDto {
  @ApiProperty({
    description: 'Credit pack size (number of credits to buy)',
    example: 100,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty({ message: 'Pack size is required' })
  @Min(1, { message: 'Pack size must be at least 1' })
  packSize: number;
}
