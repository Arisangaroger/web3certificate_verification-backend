import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('profile')
  async getProfile(@CurrentUser() currentUser: any) {
    // Get logged-in student's profile
    return this.studentsService.findOne(currentUser.userId);
  }

  @Get('count')
  async count() {
    // Get total count of all students (super admin use)
    return { count: await this.studentsService.countAll() };
  }

  @Get('university/:universityId')
  async findByUniversity(@Param('universityId') universityId: string) {
    // Get all students of a university (admin use)
    return this.studentsService.findByUniversityId(universityId);
  }

  @Get('university/:universityId/count')
  async countByUniversity(@Param('universityId') universityId: string) {
    // Get count of students for a university
    return { count: await this.studentsService.countByUniversityId(universityId) };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    // Get student by ID (admin use)
    return this.studentsService.findOne(id);
  }
}
