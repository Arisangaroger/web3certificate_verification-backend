import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminUsersService } from '../admin-users/admin-users.service';
import { StudentsService } from '../students/students.service';
import { NotificationService } from '../notification/notification.service';

interface OtpStore {
  otp: string;
  studentId: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  private otpStore: Map<string, OtpStore> = new Map();

  constructor(
    private jwtService: JwtService,
    private adminUsersService: AdminUsersService,
    private studentsService: StudentsService,
    private notificationService: NotificationService,
  ) {}

  async validateAdminUser(email: string, password: string): Promise<any> {
    const user = await this.adminUsersService.findByEmail(email);
    if (!user || !user.is_active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async loginAdmin(email: string, password: string) {
    const user = await this.validateAdminUser(email, password);
    
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      type: 'admin',
      university_id: user.university_id, // Include university_id in JWT
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        university_id: user.university_id,
      },
    };
  }

  async requestStudentOtp(student_id_number: string, national_id: string) {
    const student = await this.studentsService.findByRegistrationAndNID(
      student_id_number,
      national_id,
    ); 

    if (!student) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate 6-digit OTP
    const otp = this.notificationService.generateOTP();
    
    // Store OTP with 5-minute expiration
    const key = `${student_id_number}-${national_id}`;
    this.otpStore.set(key, {
      otp,
      studentId: student.id,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });

    // Send OTP via Email only
    await this.notificationService.sendOTP(student.email, otp);

    return {
      message: 'OTP sent successfully to your email',
      expiresIn: 300, // seconds
    };
  }

  async verifyStudentOtp(student_id_number: string, national_id: string, otp: string) {
    const key = `${student_id_number}-${national_id}`;
    const storedOtp = this.otpStore.get(key);

    if (!storedOtp) {
      throw new BadRequestException('OTP not found or expired. Please request a new one.');
    }

    // Check expiration
    if (new Date() > storedOtp.expiresAt) {
      this.otpStore.delete(key);
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    // Verify OTP
    if (storedOtp.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // OTP is valid, remove it from store
    this.otpStore.delete(key);

    // Get student details
    const student = await this.studentsService.findOne(storedOtp.studentId);

    if (!student) {
      throw new BadRequestException('Student not found');
    }

    const payload = {
      sub: student.id,
      student_id_number: student.student_id_number,
      type: 'student',
    };

    return {
      access_token: this.jwtService.sign(payload),
      student: {
        id: student.id,
        full_name: student.full_name,
        student_id_number: student.student_id_number,
        email: student.email,
      },
    };
  }
}
