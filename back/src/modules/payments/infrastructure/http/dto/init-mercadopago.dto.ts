import { IsOptional, IsString, MinLength } from 'class-validator';

export class InitMercadoPagoDto {
  @IsString()
  @MinLength(3)
  orderId!: string;

  @IsOptional()
  @IsString()
  guestCheckoutToken?: string;

  @IsOptional()
  @IsString()
  guestEmail?: string;
}
