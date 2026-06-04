import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import * as crypto from 'crypto';

@Injectable()
export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io');
    this.wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY || '', this.provider);
    
    const contractABI = [
      'function registerCertificate(bytes32 dataHash, address university) external',
      'function verifyCertificate(bytes32 dataHash) external view returns (bool, uint256, address)',
    ];
    
    this.contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS || '',
      contractABI,
      this.wallet,
    );
  }

  generateDataHash(data: any): string {
    const serialized = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  async registerCertificateBatch(dataHashes: string[]): Promise<any> {
    const tx = await this.contract.registerCertificate(
      dataHashes.map(hash => ethers.hexlify(ethers.toUtf8Bytes(hash))),
      this.wallet.address,
    );
    
    const receipt = await tx.wait();
    
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber.toString(),
    };
  }

  async verifyCertificate(dataHash: string): Promise<any> {
    const result = await this.contract.verifyCertificate(
      ethers.hexlify(ethers.toUtf8Bytes(dataHash)),
    );
    
    return {
      isValid: result[0],
      timestamp: result[1].toString(),
      university: result[2],
    };
  }
}
