import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl } from 'class-validator';

export class MockupDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty({ description: 'URL to the design file' })
  @IsUrl()
  designUrl: string;

  @ApiProperty({ enum: ['printful', 'printify', 'gelato'] })
  @IsString()
  provider: string;
}
