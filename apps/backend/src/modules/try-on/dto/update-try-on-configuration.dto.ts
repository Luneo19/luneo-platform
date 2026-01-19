import { PartialType } from '@nestjs/swagger';
import { CreateTryOnConfigurationDto } from './create-try-on-configuration.dto';

export class UpdateTryOnConfigurationDto extends PartialType(
  CreateTryOnConfigurationDto,
) {}
