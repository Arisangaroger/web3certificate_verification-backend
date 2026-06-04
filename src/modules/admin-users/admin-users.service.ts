import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminUser } from './entities/admin-user.entity';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(AdminUser)
    private adminUsersRepository: Repository<AdminUser>,
  ) {}

  async create(createAdminUserDto: CreateAdminUserDto): Promise<Omit<AdminUser, 'password_hash'>> {
    // Check if email already exists
    const existingUser = await this.findByEmail(createAdminUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const password_hash = await bcrypt.hash(createAdminUserDto.password, 10);

    // Create admin user
    const adminUser = this.adminUsersRepository.create({
      ...createAdminUserDto,
      password_hash,
    });

    const savedUser = await this.adminUsersRepository.save(adminUser);

    // Remove password_hash from response
    const { password_hash: _, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  async findAll(): Promise<AdminUser[]> {
    const users = await this.adminUsersRepository.find({
      relations: ['university'],
      select: ['id', 'email', 'full_name', 'role', 'is_active', 'created_at', 'university_id'],
    });
    return users;
  }

  async findOne(id: string): Promise<AdminUser | null> {
    return this.adminUsersRepository.findOne({ 
      where: { id },
      relations: ['university'],
      select: ['id', 'email', 'full_name', 'role', 'is_active', 'created_at', 'university_id'],
    });
  }

  async findByEmail(email: string): Promise<AdminUser | null> {
    return this.adminUsersRepository.findOne({ 
      where: { email },
      relations: ['university'],
    });
  }

  async findByUniversity(university_id: string): Promise<AdminUser[]> {
    return this.adminUsersRepository.find({
      where: { university_id },
      relations: ['university'],
      select: ['id', 'email', 'full_name', 'role', 'is_active', 'created_at', 'university_id'],
    });
  }

  async update(id: string, updateAdminUserDto: UpdateAdminUserDto): Promise<AdminUser> {
    const user = await this.findOne(id);
    
    if (!user) {
      throw new NotFoundException('Admin user not found');
    }

    // If email is being updated, check for conflicts
    if (updateAdminUserDto.email && updateAdminUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateAdminUserDto.email);
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // If password is being updated, hash it
    if (updateAdminUserDto.password) {
      updateAdminUserDto['password_hash'] = await bcrypt.hash(updateAdminUserDto.password, 10);
      delete updateAdminUserDto.password;
    }

    await this.adminUsersRepository.update(id, updateAdminUserDto);
    const updatedUser = await this.findOne(id);
    
    if (!updatedUser) {
      throw new NotFoundException('Admin user not found after update');
    }
    
    return updatedUser;
  }

  async deactivate(id: string): Promise<AdminUser> {
    const user = await this.findOne(id);
    
    if (!user) {
      throw new NotFoundException('Admin user not found');
    }
    
    if (!user.is_active) {
      throw new BadRequestException('User is already deactivated');
    }

    await this.adminUsersRepository.update(id, { is_active: false });
    const updatedUser = await this.findOne(id);
    
    if (!updatedUser) {
      throw new NotFoundException('Admin user not found after deactivation');
    }
    
    return updatedUser;
  }

  async activate(id: string): Promise<AdminUser> {
    const user = await this.findOne(id);
    
    if (!user) {
      throw new NotFoundException('Admin user not found');
    }
    
    if (user.is_active) {
      throw new BadRequestException('User is already active');
    }

    await this.adminUsersRepository.update(id, { is_active: true });
    const updatedUser = await this.findOne(id);
    
    if (!updatedUser) {
      throw new NotFoundException('Admin user not found after activation');
    }
    
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    
    if (!user) {
      throw new NotFoundException('Admin user not found');
    }
    
    await this.adminUsersRepository.remove(user);
  }
}
