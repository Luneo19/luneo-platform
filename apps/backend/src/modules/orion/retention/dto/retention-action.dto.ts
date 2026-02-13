import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RetentionActionDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];
}
