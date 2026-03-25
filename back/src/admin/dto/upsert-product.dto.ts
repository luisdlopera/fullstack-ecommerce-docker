import { Gender, Size } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
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

  @IsInt()
  @Min(0)
  inStock!: number;

  @IsNumber()
  @Min(0)
  price!: number;

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
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
