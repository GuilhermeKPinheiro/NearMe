import { IsString, MaxLength } from 'class-validator';

export class ResolveVenueEntryDto {
  @IsString()
  @MaxLength(120)
  code!: string;
}
