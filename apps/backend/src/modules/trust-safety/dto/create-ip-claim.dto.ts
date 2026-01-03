import { IsString, IsUrl, IsOptional, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIPClaimDto {
  @ApiProperty({ description: 'Design ID being claimed' })
  @IsString()
  @IsNotEmpty()
  designId: string;

  @ApiProperty({ description: 'Claimant name' })
  @IsString()
  @IsNotEmpty()
  claimantName: string;

  @ApiProperty({ description: 'Claimant email' })
  @IsString()
  @IsNotEmpty()
  claimantEmail: string;

  @ApiProperty({ description: 'Claim description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Supporting documents URLs', type: [String] })
  @IsOptional()
  @IsUrl({}, { each: true })
  supportingDocuments?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}




























