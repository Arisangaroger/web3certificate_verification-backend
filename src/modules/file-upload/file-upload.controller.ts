import { Controller, Post, UseInterceptors, UploadedFile, Body, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from './file-upload.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('file-upload')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('batch')
  @Roles('SUPER_ADMIN', 'REGISTRAR')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBatch(
    @UploadedFile() file: Express.Multer.File,
    @Body('university_id') university_id: string,
  ) {
    // Validate inputs
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!university_id) {
      throw new BadRequestException('university_id is required');
    }

    // Trim and validate UUID format
    const cleanUniversityId = university_id.trim();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(cleanUniversityId)) {
      throw new BadRequestException('Invalid university_id format. Must be a valid UUID.');
    }

    // Validate file type (accept both .xlsx and .xls)
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Please upload an Excel file (.xlsx or .xls)');
    }

    const { students, certificates } = await this.fileUploadService.processExcelFile(
      file.buffer,
      cleanUniversityId,
    );
    
    await this.fileUploadService.processBatch(students, certificates);
    
    return {
      message: 'Batch uploaded successfully',
      studentsCount: students.length,
      certificatesCount: certificates.length,
    };
  }

  @Post('batch-data')
  @Roles('SUPER_ADMIN', 'REGISTRAR')
  async uploadBatchData(
    @Body('data') data: any[],
    @Body('university_id') university_id: string,
  ) {
    // Validate inputs
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new BadRequestException('Data array is required and must not be empty');
    }

    if (!university_id) {
      throw new BadRequestException('university_id is required');
    }

    // Trim and validate UUID format
    const cleanUniversityId = university_id.trim();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(cleanUniversityId)) {
      throw new BadRequestException('Invalid university_id format. Must be a valid UUID.');
    }

    // Process the data directly (no file parsing needed)
    const { students, certificates } = this.fileUploadService.processDataArray(data, cleanUniversityId);
    
    await this.fileUploadService.processBatch(students, certificates);
    
    return {
      message: 'Batch uploaded successfully',
      studentsCount: students.length,
      certificatesCount: certificates.length,
    };
  }
}
