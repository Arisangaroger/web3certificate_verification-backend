import { Controller, Get, Param, Res, Post, Body, UseGuards, BadRequestException, NotFoundException, Patch, Delete } from '@nestjs/common';
import type { Response } from 'express';
import { CertificatesService } from './certificates.service';
import { PdfGeneratorService } from '../pdf-generator/pdf-generator.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { UniversitiesService } from '../universities/universities.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from './entities/certificate.entity';

@Controller('certificates')
export class CertificatesController {
  constructor(
    private readonly certificatesService: CertificatesService,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly blockchainService: BlockchainService,
    private readonly universitiesService: UniversitiesService,
    @InjectRepository(Certificate)
    private readonly certificatesRepository: Repository<Certificate>,
  ) {}

  @Get('student/:studentId')
  findByStudent(@Param('studentId') studentId: string) {
    return this.certificatesService.findByStudentId(studentId);
  }

  @Get('stats')
  async getStats() {
    return this.certificatesService.getStats();
  }

  @Get('university/:universityId')
  findByUniversity(@Param('universityId') universityId: string) {
    return this.certificatesService.findByUniversityId(universityId);
  }

  @Get('university/:universityId/stats')
  async getStatsByUniversity(@Param('universityId') universityId: string) {
    return this.certificatesService.getStatsByUniversity(universityId);
  }

  /**
   * Issue certificates to blockchain
   * Batch issues selected certificates to Optimism blockchain
   */
  @Post('issue-to-blockchain/:universityId')
  @UseGuards(JwtAuthGuard)
  async issueToBlockchain(
    @Param('universityId') universityId: string,
    @Body() body: { certificateIds: string[] }
  ) {
    // 1. Validate input
    if (!body.certificateIds || body.certificateIds.length === 0) {
      throw new BadRequestException('No certificates selected');
    }

    // 2. Load university and provision blockchain identity if missing
    const university = await this.universitiesService.ensureBlockchainIdentity(universityId);

    // 3. Load certificates with student relations
    const certificates = await this.certificatesRepository.find({
      where: { 
        id: In(body.certificateIds),
        university_id: universityId
      },
      relations: ['student']
    });

    if (!certificates.length) {
      throw new NotFoundException('No certificates found with provided IDs');
    }

    // 4. Verify all certificates have required student data
    for (const cert of certificates) {
      if (!cert.student) {
        throw new BadRequestException(
          `Certificate ${cert.id} is missing student data`
        );
      }
    }

    // 5. Issue to blockchain
    try {
      const txHash = await this.blockchainService.issueCertificatesBatch(
        certificates,
        university.did_identifier
      );

      // 6. Update database with transaction hash and persisted data hash
      const updatePromises = certificates.map(cert =>
        this.certificatesRepository.update(
          { id: cert.id },
          {
            blockchain_transaction_hash: txHash,
            verification_status: 'VERIFIED',
            data_hash: this.blockchainService.generateDataHash(cert),
          }
        )
      );
      
      await Promise.all(updatePromises);

      // Log for debugging
      console.log(`✅ Updated ${body.certificateIds.length} certificates to VERIFIED status`);
      console.log(`Transaction hash: ${txHash}`);

      // 7. Return success response
      return {
        success: true,
        transactionHash: txHash,
        certificatesIssued: certificates.length,
        explorerUrl: `https://sepolia-optimistic.etherscan.io/tx/${txHash}`
      };
    } catch (error: any) {
      throw new BadRequestException(
        error?.message || 'Failed to issue certificates to blockchain',
      );
    }
  }

  /**
   * Update certificate details (only if not yet on blockchain)
   */
  @Patch(':certificateId')
  @UseGuards(JwtAuthGuard)
  async updateCertificate(
    @Param('certificateId') certificateId: string,
    @Body() updateData: {
      degree_title?: string;
      graduation_year?: number;
      class_award?: string;
    }
  ) {
    try {
      const updated = await this.certificatesService.update(certificateId, updateData);
      return {
        success: true,
        message: 'Certificate updated successfully',
        certificate: updated
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Delete certificate (only if not yet on blockchain)
   */
  @Delete(':certificateId')
  @UseGuards(JwtAuthGuard)
  async deleteCertificate(@Param('certificateId') certificateId: string) {
    try {
      await this.certificatesService.delete(certificateId);
      return {
        success: true,
        message: 'Certificate deleted successfully'
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':certificateId/download')
  async downloadPdf(
    @Param('certificateId') certificateId: string,
    @Res() res: Response,
  ) {
    // Get certificate data with student and university info
    const certificate = await this.certificatesService.findByCertificateId(certificateId);

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Prepare data for PDF generation
    const pdfData = {
      certificate_id: certificate.id,
      student_name: certificate.student.full_name,
      student_id_number: certificate.student.student_id_number,
      university_name: certificate.university.name,
      degree_title: certificate.degree_title,
      graduation_year: certificate.graduation_year,
      class_award: certificate.class_award,
      verification_status: certificate.verification_status,
      blockchain_hash: certificate.blockchain_transaction_hash,
      issued_date: certificate.created_at,
    };

    // Generate PDF
    const pdfBuffer = await this.pdfGeneratorService.generateCertificatePdf(pdfData);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="certificate-${certificate.student.student_id_number}.pdf"`,
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.end(pdfBuffer);
  }
}
