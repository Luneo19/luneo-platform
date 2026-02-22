import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** GET /agents/nova/faq - query params */
export class NovaFaqQueryDto {
  @ApiProperty({ description: 'Search query' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  query: string;

  @ApiPropertyOptional({ description: 'Max number of results (1-10)', default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10)
  limit?: number = 5;
}
