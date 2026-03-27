import { IsString, MinLength } from 'class-validator';

export class InitMercadoPagoDto {
  @IsString()
  @MinLength(3)
  orderId!: string;
}
