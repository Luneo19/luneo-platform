import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsEnum,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum LunaActionType {
  CREATE_PRODUCT = 'create_product',
  UPDATE_PRODUCT = 'update_product',
  GENERATE_REPORT = 'generate_report',
  NAVIGATE = 'navigate',
  CONFIGURE = 'configure',
}

export class LunaActionDto {
  @ApiProperty({ description: 'Action type', enum: LunaActionType })
  @IsEnum(LunaActionType)
  type: LunaActionType;

  @ApiProperty({ description: 'Action label' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: 'Action payload (key-value)' })
  @IsObject()
  payload: Record<string, unknown>;

  @ApiProperty({ description: 'Whether the action requires user confirmation' })
  @IsBoolean()
  requiresConfirmation: boolean;
}

/** POST /agents/luna/action */
export class LunaActionRequestDto {
  @ApiProperty({ description: 'Action to execute' })
  @ValidateNested()
  @Type(() => LunaActionDto)
  action: LunaActionDto;
}
