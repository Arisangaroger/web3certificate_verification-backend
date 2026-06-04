import { IsString, IsNotEmpty, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  student_id_number: string;

  @IsString()
  @IsNotEmpty()
  national_id: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;
}
