import { IsString } from 'class-validator';

export class ConfirmVenueEntryDto {
  @IsString()
  venueId!: string;
}
