import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { StudentsService } from '../students/students.service';
import { CertificatesService } from '../certificates/certificates.service';
import { BlockchainService } from '../blockchain/blockchain.service';

interface StudentRow {
  student_id_number: string;
  national_id: string;
  full_name: string;
  email: string;
  phone?: string;
  photo_url?: string;
}

interface CertificateRow {
  student_id_number: string; // To link certificate to student
  degree_title: string;
  graduation_year: number;
  class_award?: string;
  university_id: string;
}

@Injectable()
export class FileUploadService {
  constructor(
    private studentsService: StudentsService,
    private certificatesService: CertificatesService,
    private blockchainService: BlockchainService,
  ) {}

  async processExcelFile(fileBuffer: Buffer, university_id: string): Promise<any> {
    const studentsMap = new Map<string, StudentRow & { university_id: string }>();
    const certificates: CertificateRow[] = [];

    // Parse Excel file
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with header normalization
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { 
      raw: false, // Get formatted values as strings
      defval: '', // Default value for empty cells
    });

    // Process each row
    for (const row of rawData) {
      // Normalize keys: trim, lowercase, replace spaces with underscores
      const normalizedRow: any = {};
      for (const key in row) {
        const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
        normalizedRow[normalizedKey] = row[key];
      }

      const studentKey = normalizedRow.student_id_number?.trim();

      if (!studentKey) {
        console.warn('Row missing student_id_number, skipping:', normalizedRow);
        continue;
      }

      // Only add student if not already in map (deduplication)
      if (!studentsMap.has(studentKey)) {
        // Strip spaces from national_id before storing
        const nationalIdRaw = normalizedRow.national_id?.toString() || '';
        const nationalIdCleaned = nationalIdRaw.replace(/\s/g, '');
        
        studentsMap.set(studentKey, {
          student_id_number: normalizedRow.student_id_number?.trim(),
          national_id: nationalIdCleaned, // Store without spaces
          full_name: normalizedRow.full_name?.trim(),
          email: normalizedRow.email?.trim(),
          phone: normalizedRow.phone?.trim(),
          photo_url: normalizedRow.photo_url?.trim(),
          university_id, // Add university_id to student
        });
      }

      // Always add certificate (multiple certificates per student)
      certificates.push({
        student_id_number: normalizedRow.student_id_number?.trim(),
        degree_title: normalizedRow.degree_title?.trim(),
        graduation_year: parseInt(normalizedRow.graduation_year, 10),
        class_award: normalizedRow.class_award?.trim(),
        university_id,
      });
    }

    // Convert Map to array for processing
    const students = Array.from(studentsMap.values());
    return { students, certificates };
  }

  processDataArray(data: any[], university_id: string): { students: any[]; certificates: any[] } {
    const studentsMap = new Map<string, any>();
    const certificates: CertificateRow[] = [];

    // Process each row
    for (const row of data) {
      const studentKey = row.student_id_number?.trim();

      if (!studentKey) {
        console.warn('Row missing student_id_number, skipping:', row);
        continue;
      }

      // Only add student if not already in map (deduplication)
      if (!studentsMap.has(studentKey)) {
        // Strip spaces from national_id before storing
        const nationalIdRaw = row.national_id?.toString() || '';
        const nationalIdCleaned = nationalIdRaw.replace(/\s/g, '');
        
        studentsMap.set(studentKey, {
          student_id_number: row.student_id_number?.trim(),
          national_id: nationalIdCleaned, // Store without spaces
          full_name: row.full_name?.trim(),
          email: row.email?.trim(),
          phone: row.phone?.trim(),
          photo_url: row.photo_url?.trim(),
          university_id, // Add university_id to student
        });
      }

      // Always add certificate (multiple certificates per student)
      certificates.push({
        student_id_number: row.student_id_number?.trim(),
        degree_title: row.degree_title?.trim(),
        graduation_year: parseInt(row.graduation_year, 10),
        class_award: row.class_award?.trim(),
        university_id,
      });
    }

    // Convert Map to array for processing
    const students = Array.from(studentsMap.values());
    return { students, certificates };
  }

  async processBatch(students: StudentRow[], certificates: CertificateRow[]): Promise<void> {
    // Step 1: Insert students one by one, skipping duplicates
    const savedStudents: any[] = [];
    const skippedStudents: string[] = [];
    
    for (const student of students) {
      try {
        // Try to find existing student first
        const existing = await this.studentsService.findByRegistrationAndNID(
          student.student_id_number,
          student.national_id
        );
        
        if (existing) {
          // Student already exists, use existing record
          savedStudents.push(existing);
          console.log(`Student ${student.student_id_number} already exists, skipping...`);
        } else {
          // Create new student
          const created = await this.studentsService.createBulk([student]);
          savedStudents.push(...created);
          console.log(`Student ${student.student_id_number} created successfully`);
        }
      } catch (error) {
        // If duplicate email/national_id error, try to find and use existing
        if (error.code === '23505') {
          console.warn(`Duplicate student detected: ${student.email}, attempting to use existing record`);
          skippedStudents.push(student.student_id_number);
          
          // Try to find by student_id_number only
          const existing = await this.studentsService.findByRegistrationAndNID(
            student.student_id_number,
            student.national_id
          );
          
          if (existing) {
            savedStudents.push(existing);
          }
        } else {
          throw error;
        }
      }
    }
    
    // Step 2: Create lookup maps for student records
    const studentIdMap = new Map<string, string>();
    const studentRecordMap = new Map<string, any>();
    savedStudents.forEach((student) => {
      studentIdMap.set(student.student_id_number, student.id);
      studentRecordMap.set(student.student_id_number, student);
    });

    // Step 3: Link certificates to students and compute data hashes
    const certificatesWithStudentIds = certificates.map((cert) => {
      const studentId = studentIdMap.get(cert.student_id_number);
      const student = studentRecordMap.get(cert.student_id_number);
      
      if (!studentId || !student) {
        throw new Error(`Student not found for certificate: ${cert.student_id_number}`);
      }

      const data_hash = this.blockchainService.generateDataHash({
        degree_title: cert.degree_title,
        graduation_year: cert.graduation_year,
        student,
      });

      return {
        id: this.generateCertificateId(),
        student_id: studentId,
        university_id: cert.university_id,
        degree_title: cert.degree_title,
        graduation_year: cert.graduation_year,
        class_award: cert.class_award,
        data_hash,
        verification_status: 'ISSUED',
      };
    });

    // Step 4: Insert all certificates
    await this.certificatesService.createBulk(certificatesWithStudentIds);
    
    // Log summary
    console.log(`✓ Batch processed: ${savedStudents.length} students, ${skippedStudents.length} skipped, ${certificates.length} certificates`);
  }

    private generateCertificateId(): string {
      // Generate 12-character NanoID-style string
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  }
