import { PartialType } from '@nestjs/swagger';
import { CreateVisualCustomizerDto } from './create-visual-customizer.dto';

export class UpdateVisualCustomizerDto extends PartialType(
  CreateVisualCustomizerDto,
) {}
