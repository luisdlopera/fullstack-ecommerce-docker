import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

function parseBooleanish(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return undefined;
}

export class UploadProductImageDto {
  @IsOptional()
  @Transform(({ value }) => parseBooleanish(value))
  @IsBoolean()
  makePrimary?: boolean;
}
