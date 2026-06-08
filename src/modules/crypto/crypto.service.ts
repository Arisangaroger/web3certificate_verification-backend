import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import * as crypto from 'crypto';

/**
 * CryptoService
 * Handles cryptographic operations for university identity management.
 * Generates keys, encrypts/decrypts sensitive data, and creates did:key identifiers.
 */
@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  private readonly masterKey: Buffer;

  constructor() {
    const masterKeyHex = process.env.MASTER_AES_KEY;
    
    if (!masterKeyHex || masterKeyHex.length !== 64) {
      throw new Error(
        'MASTER_AES_KEY must be set in .env and be exactly 64 hex characters (32 bytes)'
      );
    }

    this.masterKey = Buffer.from(masterKeyHex, 'hex');
    this.logger.log('CryptoService initialized with master key');
  }

  /**
   * Generate a complete cryptographic identity for a university.
   * Creates a new private/public key pair and derives did:key identifier.
   * 
   * @returns Object containing privateKey, publicKey, address, and didIdentifier
   */
  generateUniversityIdentity(): {
    privateKey: string;
    publicKey: string;
    address: string;
    didIdentifier: string;
  } {
    this.logger.log('Generating new university identity');

    // Generate random wallet (private/public key pair)
    const wallet = ethers.Wallet.createRandom();

    // Extract components
    const privateKey = wallet.privateKey; // 0xabcd1234...
    const publicKey = wallet.publicKey;   // 0x04abcd1234... (uncompressed format)
    const address = wallet.address;       // 0x1234... (Ethereum address)

    // Generate did:key identifier from public key
    const didIdentifier = this.generateDidKey(publicKey);

    this.logger.log(`Generated identity with DID: ${didIdentifier}`);

    return {
      privateKey,
      publicKey,
      address,
      didIdentifier,
    };
  }

  /**
   * Generate a W3C did:key identifier from an Ethereum public key.
   * Uses simplified implementation (production should use proper multicodec).
   * 
   * Format: did:key:z{base58(publicKey)}
   * 
   * @param publicKey Ethereum public key (0x04... uncompressed format)
   * @returns did:key identifier string
   */
  generateDidKey(publicKey: string): string {
    // Remove '0x04' prefix from uncompressed public key
    const publicKeyBytes = Buffer.from(publicKey.slice(4), 'hex');
    
    // For production, use proper multicodec encoding
    // Simplified: just use first 32 bytes and encode to base58-like format
    const truncated = publicKeyBytes.slice(0, 32);
    const base58Like = truncated.toString('base64')
      .replace(/\+/g, '')
      .replace(/\//g, '')
      .replace(/=/g, '')
      .slice(0, 44);

    return `did:key:z${base58Like}`;
  }

  /**
   * Encrypt a private key for secure database storage.
   * Uses AES-256-GCM with the master key from environment.
   * 
   * @param privateKey The private key to encrypt (hex string with 0x prefix)
   * @returns Encrypted string in format: iv:authTag:ciphertext
   */
  encryptPrivateKey(privateKey: string): string {
    // Generate random initialization vector
    const iv = crypto.randomBytes(16);

    // Create cipher with AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);

    // Encrypt the private key
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag for integrity verification
    const authTag = cipher.getAuthTag();

    // Return concatenated format: iv:authTag:ciphertext
    const result = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;

    this.logger.debug('Private key encrypted successfully');
    return result;
  }

  /**
   * Decrypt a private key from database storage.
   * ⚠️ WARNING: Decrypted key exists in memory - wipe immediately after use!
   * 
   * @param encryptedKey Encrypted string in format: iv:authTag:ciphertext
   * @returns Decrypted private key (hex string with 0x prefix)
   */
  decryptPrivateKey(encryptedKey: string): string {
    try {
      // Parse encrypted components
      const parts = encryptedKey.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted key format');
      }

      const [ivHex, authTagHex, ciphertext] = parts;

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      // Create decipher
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      this.logger.debug('Private key decrypted successfully');
      return decrypted;
    } catch (error) {
      this.logger.error('Failed to decrypt private key:', error.message);
      throw new Error('Decryption failed - invalid key or corrupted data');
    }
  }

  /**
   * Sign a message hash with a university's private key.
   * Used for creating audit trails and off-chain verification.
   * 
   * @param messageHash The keccak256 hash to sign
   * @param encryptedPrivateKey The university's encrypted private key from database
   * @returns Signature string (0x-prefixed hex)
   */
  async signMessageHash(
    messageHash: string,
    encryptedPrivateKey: string,
  ): Promise<string> {
    let privateKey: string | null = null;

    try {
      // Decrypt private key in memory
      privateKey = this.decryptPrivateKey(encryptedPrivateKey);

      // Create wallet instance
      const wallet = new ethers.Wallet(privateKey);

      // Sign the hash
      const signature = await wallet.signMessage(ethers.getBytes(messageHash));

      this.logger.debug(`Message signed successfully`);
      return signature;
    } finally {
      // CRITICAL: Wipe private key from memory
      if (privateKey) {
        privateKey = null;
      }
    }
  }

  /**
   * Verify a signature against a public key.
   * Used for validating university signatures during revocation.
   * 
   * @param messageHash The original message hash
   * @param signature The signature to verify
   * @param publicKeyHex The university's public key
   * @returns True if signature is valid
   */
  verifySignature(
    messageHash: string,
    signature: string,
    publicKeyHex: string,
  ): boolean {
    try {
      const recoveredAddress = ethers.verifyMessage(
        ethers.getBytes(messageHash),
        signature,
      );

      // Derive address from public key for comparison
      const expectedAddress = ethers.computeAddress(publicKeyHex);

      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      this.logger.error('Signature verification failed:', error.message);
      return false;
    }
  }
}
