import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { QrCodeService } from '../qr-code/qr-code.service';

type Tier = 'gold' | 'silver' | 'bronze' | 'neutral';

interface TierStyle {
  badgeBg: string;
  badgeColor: string;
  badgeRing: string;
  dotColor: string;
}

interface CertificatePdfData {
  certificate_id: string;
  student_name: string;
  student_id_number: string;
  university_name: string;
  degree_title: string;
  graduation_year: number;
  class_award?: string;
  verification_status: string;
  blockchain_hash?: string;
  issued_date?: Date | string;
}

@Injectable()
export class PdfGeneratorService {
  constructor(private qrCodeService: QrCodeService) {}

  async generateCertificatePdf(certificateData: CertificatePdfData): Promise<Buffer> {
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
      margin: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
    });

    await browser.close();

    return Buffer.from(pdfBuffer);
  }

  private awardTier(award: string): Tier {
    const a = (award || '').toLowerCase();
    if (a.includes('first') || a.includes('distinction') || a.includes('summa') || a.includes('1:1')) {
      return 'gold';
    }
    if (
      a.includes('upper') ||
      a.includes('2:1') ||
      a.includes('magna') ||
      a.includes('merit') ||
      a.includes('second') ||
      a.includes('2:2') ||
      a.includes('cum laude') ||
      a.includes('credit')
    ) {
      return 'silver';
    }
    if (a.includes('third') || a.includes('pass') || a.includes('3:')) {
      return 'bronze';
    }
    return 'neutral';
  }

  private tierStyles(tier: Tier): TierStyle {
    const styles: Record<Tier, TierStyle> = {
      gold: {
        badgeBg: 'linear-gradient(to right, #F6EFD6, #ECDCA9)',
        badgeColor: '#856A2B',
        badgeRing: 'rgba(213, 182, 91, 0.6)',
        dotColor: '#D5B65B',
      },
      silver: {
        badgeBg: 'linear-gradient(to right, #F1F5F9, #E2E8F0)',
        badgeColor: '#334155',
        badgeRing: '#CBD5E1',
        dotColor: '#94A3B8',
      },
      bronze: {
        badgeBg: 'linear-gradient(to right, #FEF3C7, #FDE68A)',
        badgeColor: '#92400E',
        badgeRing: '#FCD34D',
        dotColor: '#D97706',
      },
      neutral: {
        badgeBg: '#F1F5F9',
        badgeColor: '#475569',
        badgeRing: '#E2E8F0',
        dotColor: '#94A3B8',
      },
    };
    return styles[tier];
  }

  private formatIssuedDate(date?: Date | string): string | null {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private cornerFlourish(className: string): string {
    return `
      <svg class="corner ${className}" viewBox="0 0 48 48" fill="none" stroke="currentColor">
        <path d="M2 2h20" stroke-width="1.5" stroke-linecap="round" />
        <path d="M2 2v20" stroke-width="1.5" stroke-linecap="round" />
        <path d="M6 6h10M6 6v10" stroke-width="1" stroke-linecap="round" opacity="0.6" />
        <circle cx="2" cy="2" r="1.6" fill="currentColor" stroke="none" />
      </svg>
    `;
  }

  private buildCertificateHtml(data: CertificatePdfData, qrCodeDataUrl: string): string {
    const verified = data.verification_status === 'VERIFIED';
    const tier = this.awardTier(data.class_award || '');
    const ts = this.tierStyles(tier);
    const issued = this.formatIssuedDate(data.issued_date);
    const classAward = data.class_award ? this.escapeHtml(data.class_award) : '';
    const starIcon = `
      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 1l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.8 4.7 17.2l1-5.8L1.5 7.2l5.9-.9L10 1z" />
      </svg>
    `;

    const statusHtml = verified
      ? `<span class="status-verified"><span class="status-dot"></span> Verified</span>`
      : `<span class="status-issued">Issued</span>`;

    const awardBadgeHtml = classAward
      ? `
        <div class="award-badge" style="background: ${ts.badgeBg}; color: ${ts.badgeColor}; box-shadow: inset 0 0 0 1px ${ts.badgeRing};">
          <span class="award-dot" style="color: ${ts.dotColor};">${starIcon}</span>
          <span>${classAward}</span>
        </div>
      `
      : '';

    const issuedMetaHtml = issued
      ? `
        <div class="meta-item">
          <p class="meta-label">Issued</p>
          <p class="meta-value">${this.escapeHtml(issued)}</p>
        </div>
      `
      : '';

    const txHashHtml = data.blockchain_hash
      ? `
        <p class="footer-label footer-label-spaced">On-chain transaction</p>
        <p class="footer-mono">${this.escapeHtml(data.blockchain_hash)}</p>
      `
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page { size: A4 portrait; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #F8FAFC;
            color: #0F172A;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .certificate-paper {
            position: relative;
            overflow: hidden;
            border-radius: 8px;
            background-color: #fffdf8;
            background-image:
              radial-gradient(circle at 50% 0%, rgba(201, 168, 76, 0.06), transparent 60%),
              repeating-linear-gradient(45deg, rgba(27, 42, 74, 0.012) 0px, rgba(27, 42, 74, 0.012) 1px, transparent 1px, transparent 9px);
            box-shadow:
              0 18px 40px -16px rgba(15, 23, 42, 0.20),
              0 4px 10px -4px rgba(15, 23, 42, 0.08);
            border: 1px solid rgba(27, 42, 74, 0.1);
          }

          .gold-bar {
            height: 8px;
            width: 100%;
            background: linear-gradient(to right, #D5B65B, #C9A84C, #AC8B39);
          }

          .inner-frame {
            position: relative;
            margin: 16px;
            border: 1px solid rgba(27, 42, 74, 0.15);
            border-radius: 4px;
          }

          .inner-frame::before {
            content: '';
            position: absolute;
            inset: 4px;
            border: 1px solid rgba(224, 199, 120, 0.5);
            border-radius: 2px;
            pointer-events: none;
          }

          .corner {
            position: absolute;
            width: 48px;
            height: 48px;
            color: rgba(213, 182, 91, 0.7);
          }

          .corner-tl { left: 8px; top: 8px; }
          .corner-tr { right: 8px; top: 8px; transform: scaleX(-1); }
          .corner-bl { left: 8px; bottom: 8px; transform: scaleY(-1); }
          .corner-br { right: 8px; bottom: 8px; transform: scale(-1); }

          .content {
            position: relative;
            padding: 36px 40px 28px;
            text-align: center;
          }

          .university {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 18px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.22em;
            color: #1B2A4A;
          }

          .doc-type {
            margin-top: 8px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3em;
            color: #AC8B39;
          }

          .certify-line {
            margin-top: 32px;
            font-size: 14px;
            font-style: italic;
            color: #64748B;
          }

          .student-name {
            margin-top: 8px;
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 36px;
            font-weight: 700;
            line-height: 1.1;
            color: #121C33;
          }

          .requirements {
            margin: 20px auto 0;
            max-width: 420px;
            font-size: 14px;
            line-height: 1.6;
            color: #64748B;
          }

          .degree-title {
            margin-top: 12px;
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 24px;
            font-weight: 600;
            color: #1B2A4A;
          }

          .award-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-top: 20px;
            padding: 6px 16px;
            border-radius: 999px;
            font-size: 14px;
            font-weight: 600;
          }

          .award-dot {
            display: inline-flex;
            align-items: center;
          }

          .seal-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            margin-top: 36px;
          }

          .seal-line {
            width: 96px;
            height: 1px;
            background: linear-gradient(to right, transparent, #E0C778);
          }

          .seal-line-right {
            background: linear-gradient(to left, transparent, #E0C778);
          }

          .seal {
            position: relative;
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .seal-ring {
            position: absolute;
            inset: 0;
          }

          .seal-inner {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(to bottom right, #D5B65B, #AC8B39);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #121C33;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.12);
          }

          .meta-row {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 40px 40px;
            margin-top: 28px;
          }

          .meta-item {
            text-align: center;
          }

          .meta-label {
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.18em;
            color: #94A3B8;
          }

          .meta-value {
            margin-top: 4px;
            font-size: 14px;
            font-weight: 500;
            color: #1E293B;
          }

          .status-verified {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            color: #059669;
          }

          .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #10B981;
          }

          .status-issued {
            color: #D97706;
          }

          .footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            padding: 20px 24px;
            border-top: 1px dashed rgba(27, 42, 74, 0.15);
            background: rgba(243, 245, 249, 0.4);
          }

          .footer-details {
            min-width: 0;
            flex: 1;
          }

          .footer-label {
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.18em;
            color: #94A3B8;
          }

          .footer-label-spaced {
            margin-top: 8px;
          }

          .footer-mono {
            margin-top: 2px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            color: #334155;
            word-break: break-all;
          }

          .qr-section {
            flex-shrink: 0;
            text-align: center;
          }

          .qr-section img {
            width: 80px;
            height: 80px;
            border-radius: 6px;
            border: 1px solid #E2E8F0;
            background: white;
            padding: 4px;
          }

          .qr-caption {
            margin-top: 4px;
            font-size: 10px;
            color: #94A3B8;
          }
        </style>
      </head>
      <body>
        <div class="certificate-paper">
          <div class="gold-bar"></div>

          <div class="inner-frame">
            ${this.cornerFlourish('corner-tl')}
            ${this.cornerFlourish('corner-tr')}
            ${this.cornerFlourish('corner-bl')}
            ${this.cornerFlourish('corner-br')}

            <div class="content">
              <p class="university">${this.escapeHtml(data.university_name)}</p>
              <p class="doc-type">Certificate of Degree</p>

              <p class="certify-line">This is to certify that</p>
              <h2 class="student-name">${this.escapeHtml(data.student_name)}</h2>

              <p class="requirements">
                has satisfied all requirements and is hereby awarded the degree of
              </p>
              <h3 class="degree-title">${this.escapeHtml(data.degree_title)}</h3>

              ${awardBadgeHtml}

              <div class="seal-row">
                <span class="seal-line"></span>
                <div class="seal">
                  <svg class="seal-ring" viewBox="0 0 80 80" fill="none">
                    <circle cx="40" cy="40" r="38" stroke="#D5B65B" stroke-width="1.5" />
                    <circle cx="40" cy="40" r="31" stroke="#D5B65B" stroke-width="1" stroke-dasharray="2 3" />
                  </svg>
                  <div class="seal-inner">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <span class="seal-line seal-line-right"></span>
              </div>

              <div class="meta-row">
                <div class="meta-item">
                  <p class="meta-label">Conferred</p>
                  <p class="meta-value">${data.graduation_year}</p>
                </div>
                ${issuedMetaHtml}
                <div class="meta-item">
                  <p class="meta-label">Status</p>
                  <p class="meta-value">${statusHtml}</p>
                </div>
              </div>
            </div>

            <div class="footer">
              <div class="footer-details">
                <p class="footer-label">Credential ID</p>
                <p class="footer-mono">${this.escapeHtml(data.certificate_id)}</p>
                ${txHashHtml}
              </div>
              <div class="qr-section">
                <img src="${qrCodeDataUrl}" alt="Verification QR code" />
                <p class="qr-caption">Scan to verify</p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
