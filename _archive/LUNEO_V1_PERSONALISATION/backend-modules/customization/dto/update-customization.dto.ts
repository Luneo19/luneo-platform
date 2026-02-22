import { PartialType } from '@nestjs/swagger';
import { CreateCustomizationDto } from './create-customization.dto';

export class UpdateCustomizationDto extends PartialType(CreateCustomizationDto) {}
