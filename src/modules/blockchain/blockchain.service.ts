import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  private readonly REGISTRY_ABI = [
    'function issueCredentials(bytes32[] calldata _dataHashes, string[] calldata _issuerDids) external',
    'function revokeCredential(bytes32 _dataHash, string calldata _issuerDid) external',
    'function getCredential(bytes32 _dataHash) external view returns (string memory issuerDid, uint32 blockTime, bool isRevoked, bool exists)',
    'function getCredentialsBatch(bytes32[] calldata _dataHashes) external view returns (tuple(string issuerDid, uint32 blockTime, bool isRevoked)[])',
    'function credentialExists(bytes32 _dataHash) external view returns (bool)',
    'event CredentialIssued(bytes32 indexed dataHash, string indexed issuerDid, uint32 blockTime)',
    'event CredentialRevoked(bytes32 indexed dataHash, string indexed issuerDid, address revokedBy, uint32 blockTime)',
  ];

  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.OPTIMISM_SEPOLIA_RPC_URL || 'https://sepolia.optimism.io'
    );
    this.wallet = new ethers.Wallet(
      process.env.OPERATOR_PRIVATE_KEY || '',
      this.provider
    );
    
    this.contract = new ethers.Contract(
      process.env.CREDENTIAL_REGISTRY_ADDRESS || '',
      this.REGISTRY_ABI,
      this.wallet,
    );
  }

  /**
   * Builds the canonical data string for keccak256 hashing.
   * Formula: student_id_number + national_id + full_name + degree_title + graduation_year
   */
  buildDataString(certificate: any): string {
    return (
      (certificate.student?.student_id_number || '') +
      (certificate.student?.national_id || '') +
      (certificate.student?.full_name || '') +
      (certificate.degree_title || '') +
      String(certificate.graduation_year || '')
    );
  }

  /**
   * Computes keccak256 hash using Ethereum standard (NOT SHA-256).
   * Returns 0x-prefixed hex string (66 chars).
   */
  generateDataHash(certificate: any): string {
    const dataString = this.buildDataString(certificate);
    return ethers.keccak256(ethers.toUtf8Bytes(dataString));
  }

  /**
   * Issues a batch of credentials on-chain via issueCredentials function.
   * @param certificates - Array of certificate objects with populated student relation
   * @param issuerDid - The university's did_identifier (e.g., "did:key:z6Mkp...")
   * @returns Transaction hash
   */
  async issueCertificatesBatch(
    certificates: any[],
    issuerDid: string
  ): Promise<string> {
    if (!certificates.length) {
      throw new Error('Empty certificate batch');
    }

    if (!process.env.OPERATOR_PRIVATE_KEY) {
      throw new Error('Blockchain operator key is not configured on the server');
    }

    if (!process.env.CREDENTIAL_REGISTRY_ADDRESS) {
      throw new Error('Credential registry contract address is not configured on the server');
    }

    const dataHashes = certificates.map(cert => this.generateDataHash(cert));
    const issuerDids = certificates.map(() => issuerDid);

    this.logger.log(`Minting batch of ${certificates.length} credentials`);
    this.logger.log(`Issuer DID: ${issuerDid}`);

    try {
      // Validate the call off-chain first so contract reverts surface clearly.
      await this.contract.issueCredentials.staticCall(dataHashes, issuerDids);

      const gasLimit = await this.resolveGasLimit(dataHashes, issuerDids, certificates.length);
      this.logger.log(`Using gas limit: ${gasLimit.toString()}`);

      const tx = await this.contract.issueCredentials(dataHashes, issuerDids, { gasLimit });
      this.logger.log(`Transaction submitted: ${tx.hash}`);

      const receipt = await tx.wait(1);
      this.logger.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      return receipt.hash;
    } catch (error) {
      this.logger.error('Batch minting failed:', error);
      throw new Error(this.parseBlockchainError(error));
    }
  }

  /**
   * Optimism Sepolia RPC often fails gas estimation with "intrinsic gas too high"
   * even when the transaction is valid. Fall back to a safe computed limit.
   */
  private async resolveGasLimit(
    dataHashes: string[],
    issuerDids: string[],
    batchSize: number,
  ): Promise<bigint> {
    const fallbackGasLimit = 80_000n + BigInt(batchSize) * 150_000n;

    try {
      const gasEstimate = await this.contract.issueCredentials.estimateGas(
        dataHashes,
        issuerDids,
      );
      this.logger.log(`Estimated gas: ${gasEstimate.toString()}`);
      return (gasEstimate * 120n) / 100n;
    } catch (estimateError) {
      this.logger.warn(
        `Gas estimation failed, using fallback limit (${fallbackGasLimit.toString()}): ${this.parseBlockchainError(estimateError)}`,
      );
      return fallbackGasLimit;
    }
  }

  private parseBlockchainError(error: unknown): string {
    if (!(error instanceof Error)) {
      return 'Unknown blockchain error';
    }

    const err = error as Error & {
      reason?: string;
      shortMessage?: string;
      info?: { error?: { message?: string } };
    };

    if (err.reason) {
      return err.reason;
    }

    if (err.info?.error?.message) {
      return err.info.error.message;
    }

    if (err.shortMessage) {
      return err.shortMessage;
    }

    return err.message || 'Blockchain transaction failed';
  }

  /**
   * Revokes a single credential on-chain.
   * @param dataHash - The keccak256 hash (0x-prefixed)
   * @param issuerDid - The university's did_identifier
   * @returns Transaction hash
   */
  async revokeCredential(dataHash: string, issuerDid: string): Promise<string> {
    this.logger.log(`Revoking credential: ${dataHash}`);

    try {
      const tx = await this.contract.revokeCredential(dataHash, issuerDid);
      const receipt = await tx.wait(1);

      this.logger.log(`Credential revoked in tx: ${receipt.hash}`);
      return receipt.hash;
    } catch (error) {
      this.logger.error('Revocation failed:', error);
      throw error;
    }
  }

  /**
   * Retrieves credential metadata from on-chain registry.
   * Used for three-way match verification.
   * @param dataHash - The keccak256 hash (0x-prefixed)
   */
  async getCredential(dataHash: string): Promise<{
    issuerDid: string;
    blockTime: number;
    isRevoked: boolean;
    exists: boolean;
  }> {
    const result = await this.contract.getCredential(dataHash);
    
    return {
      issuerDid: result.issuerDid,
      blockTime: Number(result.blockTime),
      isRevoked: result.isRevoked,
      exists: result.exists,
    };
  }

  /**
   * Checks if a credential exists on-chain.
   */
  async credentialExists(dataHash: string): Promise<boolean> {
    return await this.contract.credentialExists(dataHash);
  }
}
