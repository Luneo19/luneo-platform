import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

/**
 * DTO for self-service account deletion (GDPR Right to Erasure).
 * Password is required to confirm identity.
 */
export class DeleteAccountDto {
  @ApiProperty({
    description: 'Current user password (required to confirm deletion)',
    example: 'MySecureP@ss1',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    description: 'Reason for deletion (stored in audit log)',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
