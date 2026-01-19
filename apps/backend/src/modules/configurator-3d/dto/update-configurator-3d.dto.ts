import { PartialType } from '@nestjs/swagger';
import { CreateConfigurator3DConfigurationDto } from './create-configurator-3d.dto';

export class UpdateConfigurator3DConfigurationDto extends PartialType(
  CreateConfigurator3DConfigurationDto,
) {}
