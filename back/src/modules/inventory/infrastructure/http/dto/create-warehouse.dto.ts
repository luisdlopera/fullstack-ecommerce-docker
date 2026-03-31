import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateWarehouseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;
}
