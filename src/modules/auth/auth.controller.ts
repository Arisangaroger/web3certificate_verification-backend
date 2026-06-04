import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('admin/login')
  async adminLogin(@Body() body: { email: string; password: string }) {
    return this.authService.loginAdmin(body.email, body.password);
  }

  @Public()
  @Post('student/request-otp')
  async requestStudentOtp(@Body() body: { student_id_number: string; national_id: string }) {
    return this.authService.requestStudentOtp(body.student_id_number, body.national_id);
  }

  @Public()
  @Post('student/verify-otp')
  async verifyStudentOtp(@Body() body: { student_id_number: string; national_id: string; otp: string }) {
    return this.authService.verifyStudentOtp(body.student_id_number, body.national_id, body.otp);
  }
}
