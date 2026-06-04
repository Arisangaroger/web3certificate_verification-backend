import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { Certificate } from './entities/certificate.entity';
// import { BlockchainModule } from '../blockchain/blockchain.module'; // DISABLED
import { PdfGeneratorModule } from '../pdf-generator/pdf-generator.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Certificate]),
    // BlockchainModule, // DISABLED - Will be enabled when blockchain is ready
    PdfGeneratorModule,
  ],
  controllers: [CertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
