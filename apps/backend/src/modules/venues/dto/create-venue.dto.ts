import { IsIn, IsLatitude, IsLongitude, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateVenueDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  description?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsString()
  @MaxLength(80)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  locationLabel?: string;

  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;

  @Min(50)
  @Max(1000)
  radiusMeters!: number;

  @IsIn(['PUBLIC', 'INVITE_ONLY'])
  privacy!: 'PUBLIC' | 'INVITE_ONLY';
}
