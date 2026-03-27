import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpsertAddressDto {
  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsString()
  @MinLength(2)
  lastName!: string;

  @IsString()
  @MinLength(3)
  address!: string;

  @IsOptional()
  @IsString()
  address2?: string;

  @IsString()
  postalCode!: string;

  @IsString()
  city!: string;

  @IsString()
  phone!: string;

  @IsString()
  countryId!: string;
}
