import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UniversitiesModule } from './modules/universities/universities.module';
import { StudentsModule } from './modules/students/students.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { AdminUsersModule } from './modules/admin-users/admin-users.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { PdfGeneratorModule } from './modules/pdf-generator/pdf-generator.module';
import { QrCodeModule } from './modules/qr-code/qr-code.module';
import { VerificationModule } from './modules/verification/verification.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      // Use DATABASE_URL if available (Render), otherwise individual vars
      ...(process.env.DATABASE_URL
        ? { url: process.env.DATABASE_URL }
        : {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'certificate_verification',
          }),
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
      // SSL required for production databases (Render, AWS RDS, etc.)
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }),
    AuthModule,
    UniversitiesModule,
    StudentsModule,
    CertificatesModule,
    AdminUsersModule,
    BlockchainModule,
    PdfGeneratorModule,
    QrCodeModule,
    VerificationModule,
    FileUploadModule,
    NotificationModule,
  ],
})
export class AppModule {}
