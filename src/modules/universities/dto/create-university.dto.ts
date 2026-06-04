import { IsString, IsEmail, IsOptional, IsUrl, MaxLength } from 'class-validator';

export class CreateUniversityDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(42)
  wallet_address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  did_identifier?: string;

  @IsOptional()
  @IsUrl()
  logo_url?: string;
}
