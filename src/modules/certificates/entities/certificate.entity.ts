import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, CreateDateColumn } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { University } from '../../universities/entities/university.entity';

@Entity('certificates')
export class Certificate {
  @PrimaryColumn({ type: 'varchar', length: 12 })
  id: string;

  @Column({ type: 'uuid' })
  student_id: string;

  @Column({ type: 'uuid' })
  university_id: string;

  @Column({ type: 'varchar', length: 255 })
  degree_title: string;

  @Column({ type: 'int' })
  graduation_year: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  class_award: string;

  @Column({ type: 'varchar', length: 66, nullable: true })
  data_hash: string;

  @Column({ type: 'text', nullable: true, default: null })
  pdf_url: string;

  @Column({ type: 'varchar', length: 66, nullable: true })
  blockchain_transaction_hash: string;

  @Column({ type: 'varchar', length: 50, default: 'ISSUED' })
  verification_status: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @ManyToOne(() => Student, (student) => student.certificates, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => University, (university) => university.certificates, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'university_id' })
  university: University;
}
