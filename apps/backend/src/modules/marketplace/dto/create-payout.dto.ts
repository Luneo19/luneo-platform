import { IsString, IsArray, IsNotEmpty, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePayoutDto {
  @ApiProperty({ description: 'Artisan ID' })
  @IsString()
  @IsNotEmpty()
  artisanId: string;

  @ApiProperty({ description: 'Work order IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  workOrderIds: string[];
}





























