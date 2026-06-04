import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { University } from '../../universities/entities/university.entity';

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  REGISTRAR = 'REGISTRAR',
  VIEWER = 'VIEWER',
}

@Entity('institution_admins')
export class AdminUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  university_id: string | null;

  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({
    type: 'enum',
    enum: AdminRole,
    default: AdminRole.VIEWER,
  })
  role: AdminRole;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @ManyToOne(() => University, (university) => university.institution_admins, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'university_id' })
  university: University | null;
}
