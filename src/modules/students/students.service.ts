import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
  ) {}

  async findByRegistrationAndNID(student_id_number: string, national_id: string): Promise<Student | null> {
    return this.studentsRepository.findOne({
      where: { student_id_number, national_id },
      relations: ['university', 'certificates'],
    });
  }

  async findOne(id: string): Promise<Student | null> {
    return this.studentsRepository.findOne({
      where: { id },
      relations: ['university', 'certificates'],
    });
  }

  async createBulk(students: Partial<Student>[]): Promise<Student[]> {
    const entities = this.studentsRepository.create(students);
    return this.studentsRepository.save(entities);
  }

  async findByUniversityId(university_id: string): Promise<Student[]> {
    return this.studentsRepository.find({
      where: { university_id },
      relations: ['university', 'certificates'],
      order: { created_at: 'DESC' },
    });
  }

  async countByUniversityId(university_id: string): Promise<number> {
    return this.studentsRepository.count({
      where: { university_id },
    });
  }

  async countAll(): Promise<number> {
    return this.studentsRepository.count();
  }
}
