import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateInventoryAdjustmentDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  warehouseId!: string;

  @IsInt()
  quantity!: number;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsString()
  @IsNotEmpty()
  note!: string;
}
