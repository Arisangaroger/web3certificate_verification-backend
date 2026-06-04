import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { University } from './entities/university.entity';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';

@Injectable()
export class UniversitiesService {
  constructor(
    @InjectRepository(University)
    private universitiesRepository: Repository<University>,
  ) {}

  async create(createUniversityDto: CreateUniversityDto): Promise<University> {
    const university = this.universitiesRepository.create(createUniversityDto);
    return this.universitiesRepository.save(university);
  }

  async findAll(): Promise<University[]> {
    return this.universitiesRepository.find();
  }

  async findOne(id: string): Promise<University> {
    const university = await this.universitiesRepository.findOne({ where: { id } });
    if (!university) {
      throw new NotFoundException(`University with ID ${id} not found`);
    }
    return university;
  }

  async findByEmail(email: string): Promise<University | null> {
    return this.universitiesRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUniversityDto: UpdateUniversityDto): Promise<University> {
    const university = await this.findOne(id);
    Object.assign(university, updateUniversityDto);
    return this.universitiesRepository.save(university);
  }

  async remove(id: string): Promise<void> {
    const university = await this.findOne(id);
    await this.universitiesRepository.remove(university);
  }
}
