import { IsString, IsNotEmpty, MinLength, MaxLength, IsStrongPassword } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Note: snake_case properties maintained for API backwards compatibility */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'CurrentSecurePass123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  current_password: string;

  @ApiProperty({
    description: 'New password (min 8 chars, requires uppercase, lowercase, number, symbol)',
    example: 'NewSecurePass123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  @MaxLength(128, { message: 'New password must not exceed 128 characters' })
  @IsStrongPassword(
    { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
    { message: 'Password must contain at least one uppercase, one lowercase, one number and one symbol' },
  )
  new_password: string;
}
