import { IsString, MinLength } from 'class-validator';

export class UpsertCountryDto {
  @IsString()
  @MinLength(2)
  id!: string;

  @IsString()
  @MinLength(2)
  name!: string;
}
