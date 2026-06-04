import { IsUUID, IsNotEmpty } from 'class-validator';

export class UploadBatchDto {
  @IsUUID()
  @IsNotEmpty()
  university_id: string;
}
