import { Module } from '@nestjs/common';
import { CADValidationService } from './cad-validation.service';

@Module({
  providers: [CADValidationService],
  exports: [CADValidationService],
})
export class CADValidationModule {}

































