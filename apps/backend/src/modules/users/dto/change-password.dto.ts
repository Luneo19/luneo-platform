import { IsString, IsNotEmpty, MinLength } from 'class-validator';
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
    description: 'New password',
    example: 'NewSecurePass123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  new_password: string;
}
