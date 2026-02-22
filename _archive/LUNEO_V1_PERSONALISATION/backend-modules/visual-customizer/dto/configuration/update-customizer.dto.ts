import { PartialType } from '@nestjs/swagger';
import { CreateCustomizerDto } from './create-customizer.dto';

export class UpdateCustomizerDto extends PartialType(CreateCustomizerDto) {}
