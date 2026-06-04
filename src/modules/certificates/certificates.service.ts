import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from './entities/certificate.entity';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private certificatesRepository: Repository<Certificate>,
  ) {}

  async findByCertificateId(certificate_id: string): Promise<Certificate | null> {
    return this.certificatesRepository.findOne({
      where: { id: certificate_id },
      relations: ['student', 'student.university', 'university'],
    });
  }

  async findByStudentId(student_id: string): Promise<Certificate[]> {
    return this.certificatesRepository.find({
      where: { student_id },
      relations: ['student', 'student.university'],
    });
  }

  async createBulk(certificates: Partial<Certificate>[]): Promise<Certificate[]> {
    const entities = this.certificatesRepository.create(certificates);
    return this.certificatesRepository.save(entities);
  }

  async updateBlockchainInfo(id: string, tx_hash: string): Promise<void> {
    await this.certificatesRepository.update(id, {
      blockchain_transaction_hash: tx_hash,
      verification_status: 'VERIFIED',
    });
  }

  async getStats() {
    const [total, verified, issued] = await Promise.all([
      this.certificatesRepository.count(),
      this.certificatesRepository.count({ where: { verification_status: 'VERIFIED' } }),
      this.certificatesRepository.count({ where: { verification_status: 'ISSUED' } }),
    ]);

    return {
      total,
      verified,
      issued,
    };
  }

  async findByUniversityId(university_id: string): Promise<Certificate[]> {
    return this.certificatesRepository.find({
      where: { university_id },
      relations: ['student', 'university'],
      order: { created_at: 'DESC' },
    });
  }

  async getStatsByUniversity(university_id: string) {
    const [total, verified, issued] = await Promise.all([
      this.certificatesRepository.count({ where: { university_id } }),
      this.certificatesRepository.count({ where: { university_id, verification_status: 'VERIFIED' } }),
      this.certificatesRepository.count({ where: { university_id, verification_status: 'ISSUED' } }),
    ]);

    return {
      total,
      verified,
      issued,
    };
  }
}
