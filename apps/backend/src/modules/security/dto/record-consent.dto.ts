import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsNotEmpty } from 'class-validator';

/**
 * DTO for recording user consent (GDPR)
 */
export class RecordConsentDto {
  @ApiProperty({
    description: 'User ID',
    example: 'user_123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Type of consent',
    example: 'marketing',
  })
  @IsString()
  @IsNotEmpty()
  consentType: string;

  @ApiProperty({
    description: 'Whether consent was given',
    example: true,
  })
  @IsBoolean()
  given: boolean;
}
