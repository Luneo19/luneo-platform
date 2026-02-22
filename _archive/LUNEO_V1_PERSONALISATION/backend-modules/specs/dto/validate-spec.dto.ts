import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateSpecDto {
  @ApiProperty({ description: 'The specification JSON object to validate' })
  @IsNotEmpty()
  spec: Record<string, unknown>;
}
