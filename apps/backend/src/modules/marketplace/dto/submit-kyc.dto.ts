import { IsArray, IsString, IsUrl, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class KYCDocumentDto {
  @ApiProperty({ description: 'Document type', enum: ['identity', 'business_license', 'tax_certificate', 'bank_statement'] })
  @IsEnum(['identity', 'business_license', 'tax_certificate', 'bank_statement'])
  type: 'identity' | 'business_license' | 'tax_certificate' | 'bank_statement';

  @ApiProperty({ description: 'Document URL' })
  @IsUrl()
  url: string;
}

export class SubmitKYCDocumentsDto {
  @ApiProperty({ description: 'KYC documents', type: [KYCDocumentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KYCDocumentDto)
  documents: KYCDocumentDto[];
}

































