import { Module } from '@nestjs/common';
import { PdfGeneratorService } from './pdf-generator.service';
import { QrCodeModule } from '../qr-code/qr-code.module';

@Module({
  imports: [QrCodeModule],
  providers: [PdfGeneratorService],
  exports: [PdfGeneratorService],
})
export class PdfGeneratorModule {}
