import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, ForbiddenException } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@Controller('admin-users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'REGISTRAR')
  async create(
    @Body() createAdminUserDto: CreateAdminUserDto,
    @CurrentUser() currentUser: any,
  ) {
    // Super admin can create admin users for any university
    if (currentUser.role === 'SUPER_ADMIN') {
      return this.adminUsersService.create(createAdminUserDto);
    }

    // Regular registrar can only create admin users for their own university
    if (createAdminUserDto.university_id !== currentUser.university_id) {
      throw new ForbiddenException('You can only create admin users for your own university');
    }

    return this.adminUsersService.create(createAdminUserDto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'REGISTRAR', 'VIEWER')
  async findAll(@CurrentUser() currentUser: any) {
    // Super admin can view all admin users
    if (currentUser.role === 'SUPER_ADMIN') {
      return this.adminUsersService.findAll();
    }

    // Regular users only see admin users from their own university
    return this.adminUsersService.findByUniversity(currentUser.university_id);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'REGISTRAR', 'VIEWER')
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: any) {
    const adminUser = await this.adminUsersService.findOne(id);
    
    if (!adminUser) {
      throw new ForbiddenException('Admin user not found');
    }

    // Super admin can view any admin user
    if (currentUser.role === 'SUPER_ADMIN') {
      return adminUser;
    }
    
    // Regular users can only view admin users from their own university
    if (adminUser.university_id !== currentUser.university_id) {
      throw new ForbiddenException('You can only view admin users from your own university');
    }

    return adminUser;
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'REGISTRAR')
  async update(
    @Param('id') id: string,
    @Body() updateAdminUserDto: UpdateAdminUserDto,
    @CurrentUser() currentUser: any,
  ) {
    const adminUser = await this.adminUsersService.findOne(id);
    
    if (!adminUser) {
      throw new ForbiddenException('Admin user not found');
    }

    // Super admin can update any admin user
    if (currentUser.role === 'SUPER_ADMIN') {
      return this.adminUsersService.update(id, updateAdminUserDto);
    }
    
    // Regular registrar can only update admin users from their own university
    if (adminUser.university_id !== currentUser.university_id) {
      throw new ForbiddenException('You can only update admin users from your own university');
    }

    return this.adminUsersService.update(id, updateAdminUserDto);
  }

  @Patch(':id/deactivate')
  @Roles('SUPER_ADMIN', 'REGISTRAR')
  async deactivate(@Param('id') id: string, @CurrentUser() currentUser: any) {
    const adminUser = await this.adminUsersService.findOne(id);
    
    if (!adminUser) {
      throw new ForbiddenException('Admin user not found');
    }

    // Super admin can deactivate any admin user
    if (currentUser.role === 'SUPER_ADMIN') {
      return this.adminUsersService.deactivate(id);
    }
    
    // Regular registrar can only deactivate admin users from their own university
    if (adminUser.university_id !== currentUser.university_id) {
      throw new ForbiddenException('You can only deactivate admin users from your own university');
    }

    return this.adminUsersService.deactivate(id);
  }

  @Patch(':id/activate')
  @Roles('SUPER_ADMIN', 'REGISTRAR')
  async activate(@Param('id') id: string, @CurrentUser() currentUser: any) {
    const adminUser = await this.adminUsersService.findOne(id);
    
    if (!adminUser) {
      throw new ForbiddenException('Admin user not found');
    }

    // Super admin can activate any admin user
    if (currentUser.role === 'SUPER_ADMIN') {
      return this.adminUsersService.activate(id);
    }
    
    // Regular registrar can only activate admin users from their own university
    if (adminUser.university_id !== currentUser.university_id) {
      throw new ForbiddenException('You can only activate admin users from your own university');
    }

    return this.adminUsersService.activate(id);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'REGISTRAR')
  async remove(@Param('id') id: string, @CurrentUser() currentUser: any) {
    const adminUser = await this.adminUsersService.findOne(id);
    
    if (!adminUser) {
      throw new ForbiddenException('Admin user not found');
    }

    // Prevent self-deletion
    if (adminUser.id === currentUser.userId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    // Super admin can delete any admin user
    if (currentUser.role === 'SUPER_ADMIN') {
      return this.adminUsersService.remove(id);
    }
    
    // Regular registrar can only delete admin users from their own university
    if (adminUser.university_id !== currentUser.university_id) {
      throw new ForbiddenException('You can only delete admin users from your own university');
    }

    return this.adminUsersService.remove(id);
  }
}
