import { IsJWT, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ 
    description: 'Refresh token (optional - can be provided in httpOnly cookie instead)', 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  @IsString({ message: 'Refresh token must be a string' })
  @IsJWT({ message: 'Refresh token must be a valid JWT' })
  @IsOptional() // ✅ Optional - backend reads from cookie if not in body
  refreshToken?: string;
}
