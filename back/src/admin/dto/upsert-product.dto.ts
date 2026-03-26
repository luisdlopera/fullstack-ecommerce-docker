import { Gender, Size } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min
} from 'class-validator';

export class UpsertProductDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsInt()
  @Min(0)
  inStock!: number;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  comparePrice?: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(Size, { each: true })
  sizes!: Size[];

  @IsString()
  slug!: string;

  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @IsEnum(Gender)
  gender!: Gender;

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
