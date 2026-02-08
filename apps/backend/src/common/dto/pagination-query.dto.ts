import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Shared query DTO for pagination with limit/offset.
 * Use with @Query() and ValidationPipe for automatic validation and transformation.
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Max number of items to return', default: 50, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Number of items to skip', default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
