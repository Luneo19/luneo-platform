import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RemoveItemQueryDto {
  @ApiProperty({ description: 'ID du design à retirer de la collection' })
  @IsString()
  @IsNotEmpty()
  designId: string;
}
