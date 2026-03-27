import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOrderNotesDto {
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  internalNotes?: string;
}
