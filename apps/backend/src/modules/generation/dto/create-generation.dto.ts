import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGenerationDto {
  @ApiProperty({
    description: 'Product ID',
    example: 'clx1234567890',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Customizations for each zone',
    example: {
      'zone-1': { text: 'Hello World', font: 'Arial', color: '#000000' },
      'zone-2': { color: '#FF0000' },
    },
  })
  @IsObject()
  @IsNotEmpty()
  customizations: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Additional user prompt',
    example: 'Make it more elegant',
  })
  @IsString()
  @IsOptional()
  userPrompt?: string;

  @ApiPropertyOptional({
    description: 'Session ID for tracking',
    example: 'session_1234567890',
  })
  @IsString()
  @IsOptional()
  sessionId?: string;
}


