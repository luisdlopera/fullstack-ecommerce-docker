import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class TransferStockDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  sourceWarehouseId!: string;

  @IsUUID()
  targetWarehouseId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
