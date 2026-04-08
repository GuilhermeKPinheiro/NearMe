import { IsString } from 'class-validator';

export class CreateConnectionRequestDto {
  @IsString()
  toUserId!: string;
}
