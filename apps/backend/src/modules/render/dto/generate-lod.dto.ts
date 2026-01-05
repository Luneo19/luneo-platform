import { IsString, IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateLODDto {
  @ApiProperty({ description: 'Design ID' })
  @IsString()
  @IsNotEmpty()
  designId: string;

  @ApiProperty({ description: 'Source model URL' })
  @IsUrl()
  @IsNotEmpty()
  sourceModelUrl: string;
}






























