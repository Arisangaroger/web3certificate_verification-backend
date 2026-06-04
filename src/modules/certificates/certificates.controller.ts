import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CertificatesService } from './certificates.service';
import { PdfGeneratorService } from '../pdf-generator/pdf-generator.service';

@Controller('certificates')
export class CertificatesController {
  constructor(
    private readonly certificatesService: CertificatesService,
    private readonly pdfGeneratorService: PdfGeneratorService,
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
