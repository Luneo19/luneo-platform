import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExecuteOverrideDto {
  @ApiProperty({ description: 'Whether to approve the override' })
  @IsBoolean()
  approved: boolean;
}
