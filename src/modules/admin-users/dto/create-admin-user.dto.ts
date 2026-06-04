import { IsEmail, IsString, IsNotEmpty, MinLength, IsEnum, IsUUID, IsOptional } from 'class-validator';
import { AdminRole } from '../entities/admin-user.entity';

export class CreateAdminUserDto {
  @IsUUID()
  @IsOptional()
  university_id?: string;

  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @IsEnum(AdminRole)
  @IsNotEmpty()
  role: AdminRole;
}
