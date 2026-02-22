import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class VariantDto {
  @ApiProperty() @IsString() id: string;
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() config?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsNumber() weight?: number;
}

export class CreateExperimentDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
  @ApiProperty({ type: [VariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  variants: VariantDto[];
}
