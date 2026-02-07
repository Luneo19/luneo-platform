import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsObject } from 'class-validator';

/**
 * DTO for onboarding step and data
 */
export class OnboardingDto {
  @ApiProperty({
    description: 'Onboarding step',
    enum: ['welcome', 'profile', 'preferences', 'complete'],
  })
  @IsEnum(['welcome', 'profile', 'preferences', 'complete'])
  step: 'welcome' | 'profile' | 'preferences' | 'complete';

  @ApiPropertyOptional({
    description: 'Step payload (e.g. name, company, role, phone for profile; preferences for preferences)',
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
