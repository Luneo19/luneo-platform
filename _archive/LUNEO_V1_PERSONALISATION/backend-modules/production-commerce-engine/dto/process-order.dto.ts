import { IsString, IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProcessOrderOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  skipRender?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  skipProduction?: boolean;

  @ApiPropertyOptional({ minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  rushOrder?: boolean;
}

export class ProcessOrderDto {
  @ApiProperty({ description: 'ID of the order to process' })
  @IsString()
  orderId: string;

  @ApiPropertyOptional({ type: ProcessOrderOptionsDto })
  @IsOptional()
  options?: ProcessOrderOptionsDto;
}

export class CancelPipelineDto {
  @ApiPropertyOptional({ description: 'Reason for cancellation' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AdvancePipelineDto {
  @ApiPropertyOptional({ description: 'Target stage to advance to' })
  @IsOptional()
  @IsString()
  targetStage?: string;
}
