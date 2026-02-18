import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsIn,
  IsUUID,
  IsNumber,
  Min,
  Max,
  MinLength,
  MaxLength,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sanitize } from '@/common/decorators/sanitize.decorator';
import { RuleType } from '@prisma/client';
import {
  CONFIGURATOR_3D_LIMITS,
} from '../../configurator-3d.constants';

// =============================================================================
// Condition/Action operator enums
// =============================================================================

export const RULE_CONDITION_OPERATORS = [
  'equals',
  'not_equals',
  'selected',
  'not_selected',
  'in',
  'not_in',
] as const;

export const RULE_ACTION_TYPES = [
  'show',
  'hide',
  'enable',
  'disable',
  'require',
  'set_price',
  'set_message',
  'validate',
] as const;

// =============================================================================
// Nested DTOs
// =============================================================================

export class RuleConditionDto {
  @ApiProperty({
    description: 'Component ID to check',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  componentId: string;

  @ApiPropertyOptional({
    description: 'Option ID (for option-specific conditions)',
  })
  @IsOptional()
  @IsUUID('4')
  optionId?: string;

  @ApiProperty({
    description: 'Comparison operator',
    enum: RULE_CONDITION_OPERATORS,
  })
  @IsIn(RULE_CONDITION_OPERATORS)
  operator: (typeof RULE_CONDITION_OPERATORS)[number];

  @ApiPropertyOptional({
    description: 'Value for comparison',
  })
  @IsOptional()
  value?: unknown;
}

export class RuleActionDto {
  @ApiProperty({
    description: 'Action type',
    enum: RULE_ACTION_TYPES,
  })
  @IsIn(RULE_ACTION_TYPES)
  action: (typeof RULE_ACTION_TYPES)[number];

  @ApiProperty({
    description: 'Target component ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  targetComponentId: string;

  @ApiPropertyOptional({
    description: 'Target option ID',
  })
  @IsOptional()
  @IsUUID('4')
  targetOptionId?: string;

  @ApiPropertyOptional({
    description: 'Action value',
  })
  @IsOptional()
  value?: unknown;

  @ApiPropertyOptional({
    description: 'Message (e.g. for validation errors)',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

// =============================================================================
// Main DTO
// =============================================================================

export class CreateRuleDto {
  @ApiProperty({
    description: 'Configuration ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  configurationId: string;

  @ApiProperty({
    description: 'Rule name',
    example: 'Hide strap when metal case selected',
    minLength: CONFIGURATOR_3D_LIMITS.MIN_NAME_LENGTH,
    maxLength: CONFIGURATOR_3D_LIMITS.MAX_NAME_LENGTH,
  })
  @IsString()
  @MinLength(CONFIGURATOR_3D_LIMITS.MIN_NAME_LENGTH)
  @MaxLength(CONFIGURATOR_3D_LIMITS.MAX_NAME_LENGTH)
  @Sanitize()
  name: string;

  @ApiPropertyOptional({
    description: 'Rule description',
    maxLength: CONFIGURATOR_3D_LIMITS.MAX_DESCRIPTION_LENGTH,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Rule type',
    enum: RuleType,
  })
  @IsEnum(RuleType)
  type: RuleType;

  @ApiProperty({
    description: 'Conditions (AND logic)',
    type: [RuleConditionDto],
    minItems: 1,
    maxItems: CONFIGURATOR_3D_LIMITS.MAX_CONDITIONS_PER_RULE,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleConditionDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(CONFIGURATOR_3D_LIMITS.MAX_CONDITIONS_PER_RULE)
  conditions: RuleConditionDto[];

  @ApiProperty({
    description: 'Actions to execute',
    type: [RuleActionDto],
    minItems: 1,
    maxItems: CONFIGURATOR_3D_LIMITS.MAX_ACTIONS_PER_RULE,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleActionDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(CONFIGURATOR_3D_LIMITS.MAX_ACTIONS_PER_RULE)
  actions: RuleActionDto[];

  @ApiPropertyOptional({
    description: 'Priority (0-1000, higher = earlier)',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  priority?: number = 0;

  @ApiPropertyOptional({ description: 'Rule enabled', default: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean = true;

  @ApiPropertyOptional({
    description: 'Stop processing further rules when matched',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  stopProcessing?: boolean = false;
}
