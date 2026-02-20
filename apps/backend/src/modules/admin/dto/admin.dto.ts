import { IsString, IsArray, IsIn, IsOptional, IsObject, IsInt, Min, Max, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ListClientsQueryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() plan?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sortBy?: string;
  @ApiPropertyOptional({ enum: ['asc', 'desc'] }) @IsOptional() @IsIn(['asc', 'desc']) sortOrder?: 'asc' | 'desc';
}

export class UpdateClientDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() plan?: string;
  @ApiPropertyOptional({ enum: ['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'] }) @IsOptional() @IsIn(['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION']) status?: string;
}

export class GrantSubscriptionDto {
  @ApiProperty() @IsString() planId: string;
  @ApiProperty() @IsInt() @Min(1) @Max(24) months: number;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

export class CreatePromoCodeDto {
  @ApiProperty() @IsString() code: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(100) percentOff?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) amountOff?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiProperty({ enum: ['once', 'repeating', 'forever'] }) @IsString() @IsIn(['once', 'repeating', 'forever']) duration: 'once' | 'repeating' | 'forever';
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(12) durationInMonths?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) maxRedemptions?: number;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) plans?: string[];
}

export class UpdatePromoCodeDto {
  @ApiProperty() @IsBoolean() active: boolean;
}

export class AddBlacklistedPromptDto {
  @ApiProperty({ description: 'Term to blacklist', example: 'offensive-term' })
  @IsString()
  term: string;
}

export class BulkActionCustomersDto {
  @ApiProperty({ description: 'Customer IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  customerIds: string[];

  @ApiProperty({ description: 'Action to perform', enum: ['email', 'export', 'tag', 'segment', 'delete'] })
  @IsIn(['email', 'export', 'tag', 'segment', 'delete'])
  action: 'email' | 'export' | 'tag' | 'segment' | 'delete';

  @ApiPropertyOptional({ description: 'Additional options' })
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}
