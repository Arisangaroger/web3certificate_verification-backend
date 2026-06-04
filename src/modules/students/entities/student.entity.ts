import { Entity, Column, ManyToOne, JoinColumn, OneToMany, PrimaryGeneratedColumn, CreateDateColumn, Unique } from 'typeorm';
import { University } from '../../universities/entities/university.entity';
import { Certificate } from '../../certificates/entities/certificate.entity';

@Entity('student')
@Unique('unique_university_student_id', ['university_id', 'student_id_number'])
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  university_id: string;

  @Column({ type: 'varchar', length: 100 })
  student_id_number: string;

  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  national_id: string;

  @Column({ type: 'text', nullable: true })
  photo_url: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @ManyToOne(() => University, (university) => university.students, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'university_id' })
  university: University;

  @OneToMany(() => Certificate, (certificate) => certificate.student)
  certificates: Certificate[];
}
