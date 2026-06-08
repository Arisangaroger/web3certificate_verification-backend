import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { BlockchainService } from '../modules/blockchain/blockchain.service';
import { Certificate } from '../modules/certificates/entities/certificate.entity';

/**
 * Script to regenerate data_hash for all certificates using keccak256
 * Run: npx ts-node src/scripts/regenerate-hashes.ts
 */
async function regenerateHashes() {
  console.log('🔄 Starting hash regeneration...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const blockchainService = app.get(BlockchainService);

  // Get all certificates with student relations
  const certificates = await dataSource
    .getRepository(Certificate)
    .find({
      relations: ['student'],
    });

  console.log(`Found ${certificates.length} certificates to process\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const cert of certificates) {
    try {
      if (!cert.student) {
        console.log(`⚠️  Certificate ${cert.id} - Missing student relation, skipping`);
        skipped++;
        continue;
      }

      // Generate new hash using keccak256
      const newHash = blockchainService.generateDataHash(cert);
      
      // Check if hash needs updating
      if (cert.data_hash === newHash) {
        console.log(`✓ Certificate ${cert.id} - Hash already correct`);
        skipped++;
        continue;
      }

      // Update the hash
      await dataSource
        .getRepository(Certificate)
        .update(cert.id, { data_hash: newHash });

      console.log(`✅ Certificate ${cert.id} - Hash updated`);
      console.log(`   Old: ${cert.data_hash}`);
      console.log(`   New: ${newHash}\n`);
      updated++;

    } catch (error) {
      console.error(`❌ Certificate ${cert.id} - Error:`, error.message);
      errors++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Total: ${certificates.length}`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⚠️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);

  await app.close();
  process.exit(0);
}

regenerateHashes().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
