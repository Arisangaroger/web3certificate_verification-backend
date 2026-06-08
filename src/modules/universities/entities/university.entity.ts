import { Entity, Column, OneToMany, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { AdminUser } from '../../admin-users/entities/admin-user.entity';
import { Student } from '../../students/entities/student.entity';
import { Certificate } from '../../certificates/entities/certificate.entity';

@Entity('universities')
export class University {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 42, nullable: true })
  wallet_address: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  did_identifier: string;

  @Column({ type: 'text', nullable: true })
  encrypted_private_key: string;

  @Column({ type: 'varchar', length: 132, nullable: true })
  public_key_hex: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone_number: string;

  @Column({ type: 'text', nullable: true })
  logo_url: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @OneToMany(() => AdminUser, (admin) => admin.university)
  institution_admins: AdminUser[];

  @OneToMany(() => Student, (student) => student.university)
  students: Student[];

  @OneToMany(() => Certificate, (certificate) => certificate.university)
  certificates: Certificate[];
}
