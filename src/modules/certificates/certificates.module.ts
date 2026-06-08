import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { Certificate } from './entities/certificate.entity';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { PdfGeneratorModule } from '../pdf-generator/pdf-generator.module';
import { UniversitiesModule } from '../universities/universities.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Certificate]),
    BlockchainModule,
    PdfGeneratorModule,
    UniversitiesModule,
  ],
  controllers: [CertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
