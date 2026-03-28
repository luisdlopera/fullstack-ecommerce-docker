import { IsString } from 'class-validator';

export class AddFavoriteDto {
  @IsString()
  productId!: string;
}
