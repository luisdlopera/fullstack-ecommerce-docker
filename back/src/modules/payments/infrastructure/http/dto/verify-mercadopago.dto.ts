import { IsString, MinLength } from 'class-validator';

export class VerifyMercadoPagoDto {
  @IsString()
  @MinLength(3)
  paymentId!: string;
}
