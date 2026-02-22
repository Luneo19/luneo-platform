import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/** Note: snake_case properties maintained for API backwards compatibility */
export class ConversionStatusQueryDto {
  @ApiProperty({ description: 'Meshy.ai task ID' })
  @IsString()
  @IsNotEmpty()
  task_id: string;
}
