import { Size } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateOrderItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsEnum(Size)
  size!: Size;
}

class CreateOrderAddressDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
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

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ValidateNested()
  @Type(() => CreateOrderAddressDto)
  address!: CreateOrderAddressDto;
}

export class UpdateOrderPaymentDto {
  @IsOptional()
  @IsNumber()
  paidAmount?: number;

  @IsString()
  transactionId!: string;
}
