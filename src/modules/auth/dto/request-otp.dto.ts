import { IsString, IsNotEmpty } from 'class-validator';

export class RequestOtpDto {
  @IsString()
  @IsNotEmpty()
  student_id_number: string;

  @IsString()
  @IsNotEmpty()
  national_id: string;
}
