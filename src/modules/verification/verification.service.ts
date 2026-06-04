import { Injectable, NotFoundException } from '@nestjs/common';
import { CertificatesService } from '../certificates/certificates.service';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class VerificationService {
  constructor(
    private certificatesService: CertificatesService,
    private blockchainService: BlockchainService,
  ) {}

  async verifyCertificate(certificate_id: string): Promise<any> {
    const certificate = await this.certificatesService.findByCertificateId(certificate_id);
    
    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    const certificateData = {
      student_id_number: certificate.student.student_id_number,
      full_name: certificate.student.full_name,
      degree_title: certificate.degree_title,
      graduation_year: certificate.graduation_year,
      class_award: certificate.class_award,
    };

    const computedHash = this.blockchainService.generateDataHash(certificateData);

    const blockchainVerification = await this.blockchainService.verifyCertificate(
      certificate.data_hash,
    );

    const isValid = 
      computedHash === certificate.data_hash && 
      blockchainVerification.isValid;

    return {
      isValid,
      certificate: {
        certificate_id: certificate.id,
        student_name: certificate.student.full_name,
        student_id_number: certificate.student.student_id_number,
        university_name: certificate.university.name,
        degree_title: certificate.degree_title,
        graduation_year: certificate.graduation_year,
        class_award: certificate.class_award,
      },
      blockchain: {
        transaction_hash: certificate.blockchain_transaction_hash,
        timestamp: blockchainVerification.timestamp,
      },
      verification: {
        database_hash_match: computedHash === certificate.data_hash,
        blockchain_verified: blockchainVerification.isValid,
        status: certificate.verification_status,
      },
    };
  }
}
