import { IsString, IsArray, IsIn, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
