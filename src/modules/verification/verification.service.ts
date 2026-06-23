import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CertificatesService } from '../certificates/certificates.service';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class VerificationService {
  constructor(
    private certificatesService: CertificatesService,
    private blockchainService: BlockchainService,
  ) {}

  /**
   * Three-Way Match Verification Engine (did:key Framework)
   * 
   * Step 1: Database metadata resolution
   * Step 2: Runtime hash recalculation (keccak256)
   * Step 3: On-chain registry validation (three gates)
   */
  async verifyCertificate(certificate_id: string): Promise<any> {
    // Step 1: Database Metadata Resolution
    const certificate = await this.certificatesService.findByCertificateId(certificate_id);
    
    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    // Ensure student and university relations are loaded
    if (!certificate.student || !certificate.university) {
      throw new BadRequestException('Certificate missing required relations');
    }

    // Step 2: Runtime Hash Recalculation
    const recomputedHash = this.blockchainService.generateDataHash(certificate);

    // Backfill hash for certificates issued before hash persistence was added
    if (!certificate.data_hash) {
      const onChainProbe = await this.blockchainService.getCredential(recomputedHash);
      if (onChainProbe.exists && !onChainProbe.isRevoked) {
        await this.certificatesService.updateDataHash(certificate.id, recomputedHash);
        certificate.data_hash = recomputedHash;
      }
    }

    // Data tampering check: compare recomputed hash with stored hash
    if (recomputedHash !== certificate.data_hash) {
      return {
        isValid: false,
        message: 'Database record hash does not match recomputed hash. Data may have been tampered with.',
      };
    }

    // Step 3: On-Chain Registry Validation (Three Gates)
    let onChainData;
    try {
      onChainData = await this.blockchainService.getCredential(certificate.data_hash);
    } catch (error) {
      return {
        isValid: false,
        message: 'Failed to query blockchain registry.',
      };
    }

    // Gate 1: Record must exist on-chain
    if (!onChainData.exists) {
      return {
        isValid: false,
        message: 'No on-chain record found for this credential hash.',
      };
    }

    // Gate 2: Must not be revoked
    if (onChainData.isRevoked) {
      return {
        isValid: false,
        message: 'This credential has been revoked by the issuing university.',
      };
    }

    // Gate 3: On-chain issuerDid must exactly match local DB did_identifier
    if (onChainData.issuerDid !== certificate.university.did_identifier) {
      return {
        isValid: false,
        message: 'Issuer DID on chain does not match database record. Possible fraud.',
      };
    }

    // All three gates passed ✅
    return {
      isValid: true,
      certificate: {
        certificate_id: certificate.id,
        student_name: certificate.student.full_name,
        student_id_number: certificate.student.student_id_number,
        degree_title: certificate.degree_title,
        graduation_year: certificate.graduation_year,
        class_award: certificate.class_award,
        university_name: certificate.university.name,
      },
      blockchain: {
        transaction_hash: certificate.blockchain_transaction_hash,
        timestamp: new Date(onChainData.blockTime * 1000).toISOString(),
      },
      verification: {
        database_hash_match: true,
        blockchain_verified: true,
        status: certificate.verification_status,
      },
      message: 'Credential is authentic and has not been tampered with.',
    };
  }
}
