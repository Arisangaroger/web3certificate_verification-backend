import { Controller, Get, Param } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Public()
  @Get(':certificate_id')
  async verify(@Param('certificate_id') certificate_id: string) {
    return this.verificationService.verifyCertificate(certificate_id);
  }
}
