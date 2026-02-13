import { IsOptional, IsString, IsIn } from 'class-validator';

export class SearchQueryDto {
  @IsString()
  q: string;

  @IsOptional()
  @IsString()
  types?: string; // comma-separated: products,designs,orders
}
