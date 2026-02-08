import { PartialType } from '@nestjs/swagger';
import { CreateCreditPackDto } from './create-credit-pack.dto';

export class UpdateCreditPackDto extends PartialType(CreateCreditPackDto) {}
