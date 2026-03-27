import { IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MercadoPagoWebhookDataDto {
  @IsOptional()
  @IsString()
  id?: string;
}

export class MercadoPagoWebhookBodyDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MercadoPagoWebhookDataDto)
  data?: MercadoPagoWebhookDataDto;
}
