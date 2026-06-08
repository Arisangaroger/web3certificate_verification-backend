import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { University } from './entities/university.entity';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { CryptoService } from '../crypto/crypto.service';

@Injectable()
export class UniversitiesService {
  private readonly logger = new Logger(UniversitiesService.name);

  constructor(
    @InjectRepository(University)
    private universitiesRepository: Repository<University>,
    private cryptoService: CryptoService,
  ) {}

  /**
   * Create a new university with auto-generated blockchain identity.
   * Automatically generates private/public keys and did:key identifier.
   */
  async create(createUniversityDto: CreateUniversityDto): Promise<University> {
    this.logger.log(`Creating university: ${createUniversityDto.name}`);

    // Generate cryptographic identity for the university
    const identity = this.cryptoService.generateUniversityIdentity();
    this.logger.log(`Generated blockchain identity for ${createUniversityDto.name}`);

    // Encrypt private key before storing in database
    const encryptedPrivateKey = this.cryptoService.encryptPrivateKey(
      identity.privateKey,
    );

    // Create university entity with blockchain identity
    const university = this.universitiesRepository.create({
      ...createUniversityDto,
      did_identifier: identity.didIdentifier,
      encrypted_private_key: encryptedPrivateKey,
      public_key_hex: identity.publicKey,
      wallet_address: identity.address,
    });

    const savedUniversity = await this.universitiesRepository.save(university);

    this.logger.log(
      `University created successfully with DID: ${savedUniversity.did_identifier}`,
    );

    return savedUniversity;
  }

  async findAll(): Promise<University[]> {
    return this.universitiesRepository.find();
  }

  async findOne(id: string): Promise<University> {
    const university = await this.universitiesRepository.findOne({ where: { id } });
    if (!university) {
      throw new NotFoundException(`University with ID ${id} not found`);
    }
    return university;
  }

  async findByEmail(email: string): Promise<University | null> {
    return this.universitiesRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUniversityDto: UpdateUniversityDto): Promise<University> {
    const university = await this.findOne(id);
    Object.assign(university, updateUniversityDto);
    return this.universitiesRepository.save(university);
  }

  async remove(id: string): Promise<void> {
    const university = await this.findOne(id);
    await this.universitiesRepository.remove(university);
  }

  /**
   * Regenerate blockchain identity for a university (use with caution!)
   * This will invalidate all previous blockchain certificates.
   */
  async regenerateIdentity(id: string): Promise<University> {
    this.logger.warn(`Regenerating blockchain identity for university: ${id}`);

    const university = await this.findOne(id);

    // Generate new identity
    const identity = this.cryptoService.generateUniversityIdentity();
    const encryptedPrivateKey = this.cryptoService.encryptPrivateKey(
      identity.privateKey,
    );

    // Update university with new identity
    university.did_identifier = identity.didIdentifier;
    university.encrypted_private_key = encryptedPrivateKey;
    university.public_key_hex = identity.publicKey;
    university.wallet_address = identity.address;

    return this.universitiesRepository.save(university);
  }
}
