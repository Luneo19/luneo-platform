import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/**
 * DTO for verifying a creator (admin only)
 */
export class VerifyCreatorDto {
  @ApiProperty({
    description: 'Whether the creator is verified',
    example: true,
  })
  @IsBoolean()
  verified: boolean;
}
