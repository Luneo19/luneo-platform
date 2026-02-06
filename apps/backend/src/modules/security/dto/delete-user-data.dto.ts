import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for deleting user data (GDPR Right to Erasure)
 */
export class DeleteUserDataDto {
  @ApiPropertyOptional({
    description: 'Reason for deletion',
    example: 'User requested data deletion',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
