import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class AdjustInventoryDto {
  @IsInt()
  quantity!: number;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}
