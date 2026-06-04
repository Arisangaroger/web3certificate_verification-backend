import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { CertificatesModule } from '../certificates/certificates.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [CertificatesModule, BlockchainModule],
  controllers: [VerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}
