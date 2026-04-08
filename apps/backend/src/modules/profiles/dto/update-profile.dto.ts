import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @MaxLength(80)
  displayName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  headline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  whatsappUrl?: string;

  @IsOptional()
  @IsString()
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  tiktokUrl?: string;

  @IsOptional()
  @IsString()
  snapchatUrl?: string;

  @IsOptional()
  @IsString()
  otherSocialUrl?: string;

  @IsOptional()
  @IsString()
  linkedInUrl?: string;

  @IsOptional()
  @IsString()
  professionTag?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsBoolean()
  isVisibleByDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  showPhoneNumber?: boolean;

  @IsOptional()
  @IsBoolean()
  showSocialLinks?: boolean;

  @IsOptional()
  @IsString()
  publicPhotoUrls?: string;

  @IsOptional()
  @IsString()
  matchOnlyPhotoUrls?: string;

  @IsOptional()
  @IsString()
  storyPhotoUrls?: string;

  @IsOptional()
  @IsString()
  matchOnlyStoryPhotoUrls?: string;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(10000)
  preferredRadiusMeters?: number;
}
