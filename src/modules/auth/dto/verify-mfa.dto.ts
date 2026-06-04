import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class VerifyMfaDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}
