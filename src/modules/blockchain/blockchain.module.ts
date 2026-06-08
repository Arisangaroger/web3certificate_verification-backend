import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { CryptoModule } from '../crypto/crypto.module';

@Module({
  imports: [CryptoModule],
  providers: [BlockchainService],
  exports: [BlockchainService],
})
export class BlockchainModule {}
