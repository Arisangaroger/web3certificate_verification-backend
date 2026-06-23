import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { StudentsModule } from '../students/students.module';
import { CertificatesModule } from '../certificates/certificates.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [
    StudentsModule,
    CertificatesModule,
    BlockchainModule,
  ],
  controllers: [FileUploadController],
  providers: [FileUploadService],
  exports: [FileUploadService],
})
export class FileUploadModule {}
