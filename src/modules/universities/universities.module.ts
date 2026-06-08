import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UniversitiesService } from './universities.service';
import { UniversitiesController } from './universities.controller';
import { University } from './entities/university.entity';
import { CryptoModule } from '../crypto/crypto.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([University]),
    CryptoModule,
  ],
  controllers: [UniversitiesController],
  providers: [UniversitiesService],
  exports: [UniversitiesService],
})
export class UniversitiesModule {}
