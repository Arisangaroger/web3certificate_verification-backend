import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { QrCodeService } from '../qr-code/qr-code.service';

@Injectable()
export class PdfGeneratorService {
  constructor(private qrCodeService: QrCodeService) {}

  async generateCertificatePdf(certificateData: any): Promise<Buffer> {
    const qrCodeDataUrl = await this.qrCodeService.generateQrCode(
      `${process.env.FRONTEND_URL}/verify/${certificateData.certificate_id}`,
    );

    const html = this.buildCertificateHtml(certificateData, qrCodeDataUrl);

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    });

    await browser.close();

    return Buffer.from(pdfBuffer);
  }

  private buildCertificateHtml(data: any, qrCodeDataUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page { size: A4 landscape; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: 'Georgia', 'Times New Roman', serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            width: 297mm;
            height: 210mm;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20mm;
          }
          
          .certificate {
            background: white;
            width: 100%;
            height: 100%;
            padding: 40px 60px;
            border: 15px solid #4a5568;
            border-radius: 10px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          
          .certificate::before {
            content: '';
            position: absolute;
            top: 25px;
            left: 25px;
            right: 25px;
            bottom: 25px;
            border: 3px solid #cbd5e0;
            border-radius: 5px;
            pointer-events: none;
          }
          
          .header {
            text-align: center;
            border-bottom: 3px solid #4a5568;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .title {
            font-size: 56px;
            font-weight: bold;
            color: #2d3748;
            letter-spacing: 4px;
            margin-bottom: 10px;
            text-transform: uppercase;
          }
          
          .subtitle {
            font-size: 22px;
            color: #667eea;
            font-weight: 600;
            margin-top: 10px;
          }
          
          .content {
            text-align: center;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 20px 0;
          }
          
          .presents {
            font-size: 20px;
            color: #4a5568;
            font-style: italic;
            margin-bottom: 20px;
          }
          
          .student-name {
            font-size: 48px;
            color: #2d3748;
            font-weight: bold;
            margin: 20px 0;
            padding: 20px;
            border-top: 2px solid #e2e8f0;
            border-bottom: 2px solid #e2e8f0;
          }
          
          .achievement {
            font-size: 18px;
            color: #4a5568;
            line-height: 1.8;
            margin: 15px 0;
          }
          
          .degree {
            font-size: 32px;
            color: #667eea;
            font-weight: 600;
            margin: 20px 0;
          }
          
          .award {
            font-size: 22px;
            color: #48bb78;
            font-weight: 600;
            margin: 15px 0;
          }
          
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-top: 3px solid #4a5568;
            padding-top: 20px;
            margin-top: 20px;
          }
          
          .qr-section {
            text-align: center;
          }
          
          .qr-section img {
            width: 100px;
            height: 100px;
            border: 3px solid #4a5568;
            border-radius: 5px;
            padding: 5px;
            background: white;
          }
          
          .qr-text {
            font-size: 10px;
            color: #718096;
            margin-top: 8px;
          }
          
          .certificate-details {
            text-align: left;
            flex: 1;
            margin-left: 40px;
          }
          
          .detail-row {
            font-size: 13px;
            color: #4a5568;
            margin: 5px 0;
          }
          
          .detail-label {
            font-weight: 600;
            color: #2d3748;
          }
          
          .verification-badge {
            text-align: right;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }
          
          .badge {
            background: ${data.verification_status === 'VERIFIED' ? '#48bb78' : '#ed8936'};
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 10px;
          }
          
          .blockchain-hash {
            font-size: 9px;
            color: #718096;
            font-family: 'Courier New', monospace;
            max-width: 200px;
            word-break: break-all;
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">
            <div class="title">Certificate of Achievement</div>
            <div class="subtitle">${data.university_name}</div>
          </div>
          
          <div class="content">
            <div class="presents">This is to certify that</div>
            <div class="student-name">${data.student_name}</div>
            <div class="achievement">Student ID: ${data.student_id_number}</div>
            <div class="achievement">has successfully completed the requirements for the degree of</div>
            <div class="degree">${data.degree_title}</div>
            ${data.class_award ? `<div class="award">Class of Award: ${data.class_award}</div>` : ''}
            <div class="achievement">In the year <strong>${data.graduation_year}</strong></div>
          </div>
          
          <div class="footer">
            <div class="qr-section">
              <img src="${qrCodeDataUrl}" alt="QR Code" />
              <div class="qr-text">Scan to verify</div>
            </div>
            
            <div class="certificate-details">
              <div class="detail-row">
                <span class="detail-label">Certificate ID:</span> ${data.certificate_id}
              </div>
              <div class="detail-row">
                <span class="detail-label">Issued Date:</span> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div class="detail-row">
                <span class="detail-label">Verification:</span> Blockchain Secured
              </div>
            </div>
            
            <div class="verification-badge">
              <div class="badge">${data.verification_status === 'VERIFIED' ? '✓ Verified' : '⏳ Issued'}</div>
              ${data.blockchain_hash ? `<div class="blockchain-hash">Blockchain: ${data.blockchain_hash.substring(0, 40)}...</div>` : ''}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
