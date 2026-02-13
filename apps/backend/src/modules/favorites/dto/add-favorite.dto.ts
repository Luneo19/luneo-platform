import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddFavoriteDto {
  @ApiProperty({ description: 'Resource ID (e.g. design, product)' })
  @IsString()
  @IsNotEmpty()
  resourceId: string;

  @ApiProperty({ description: 'Resource type (e.g. design, product)' })
  @IsString()
  @IsNotEmpty()
  resourceType: string;
}
