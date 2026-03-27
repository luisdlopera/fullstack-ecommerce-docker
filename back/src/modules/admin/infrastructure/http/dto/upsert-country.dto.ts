import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpsertCountryDto {
  @IsString()
  @MinLength(2)
  id!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  isoCode?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  allowsShipping?: boolean;

  @IsOptional()
  @IsBoolean()
  allowsPurchase?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingBaseCost?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  etaDays?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}
