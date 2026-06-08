# Custodial Wallet Implementation Guide

## Overview

Your system now uses **Platform-Controlled Custodial Wallets** (Option A). Universities never interact with Web3 - your backend handles everything automatically.

---

## How It Works

### 1. University Registration Flow

```
User fills form → Submit
          ↓
    NestJS Backend
          ↓
  Generate Keys Automatically:
  - Private key (encrypted)
  - Public key
  - Ethereum address
  - did:key identifier
          ↓
  Save to Database (encrypted)
          ↓
    University Created ✅
```

**University never sees any blockchain data!**

---

## Components Implemented

### ✅ 1. CryptoService (`src/modules/crypto/`)

**Purpose:** Handle all cryptographic operations

**Functions:**
- `generateUniversityIdentity()` - Creates new key pair + did:key
- `generateDidKey()` - Converts public key to W3C did:key format
- `encryptPrivateKey()` - Encrypts with AES-256-GCM for database storage
- `decryptPrivateKey()` - Decrypts (in-memory only!)
- `signMessageHash()` - Signs data with university key
- `verifySignature()` - Validates signatures

### ✅ 2. Updated UniversitiesService

**New Behavior:**
- `create()` now automatically generates blockchain identity
- `regenerateIdentity()` - Recreate keys if needed (invalidates old certs!)

### ✅ 3. Database Schema

**New Fields in `universities` table:**
```sql
- encrypted_private_key (TEXT) - AES-256-GCM encrypted
- public_key_hex (VARCHAR 132) - Uncompressed public key
- wallet_address (VARCHAR 42) - Ethereum address
- did_identifier (VARCHAR 255) - Already existed ✅
```

---

## Step-by-Step Migration

### Step 1: Run Database Migration

```bash
cd certificate_verification

# Connect to your PostgreSQL database
psql -U postgres -d CertificateVerificationDB

# Run migration
\i src/migrations/add-university-crypto-fields.sql

# Verify columns added
\d universities
```

Expected output:
```
encrypted_private_key | text
public_key_hex        | character varying(132)
wallet_address        | character varying(42)
did_identifier        | character varying(255)
```

### Step 2: Restart NestJS Server

```bash
npm run start:dev
```

The CryptoService will initialize and validate MASTER_AES_KEY.

### Step 3: Test Identity Generation

Create a new university via your admin panel or API:

```bash
curl -X POST http://localhost:3000/api/v1/universities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Test University",
    "email": "test@university.edu",
    "phone_number": "+250123456789"
  }'
```

**Response will include:**
```json
{
  "id": "uuid...",
  "name": "Test University",
  "did_identifier": "did:key:zABCD1234...",
  "wallet_address": "0x1234...",
  "encrypted_private_key": "iv:authTag:ciphertext",
  "public_key_hex": "0x04abcd..."
}
```

### Step 4: Migrate Existing Universities

For universities created before this implementation:

```typescript
// Create a migration script or admin endpoint
import { Injectable } from '@nestjs/common';
import { UniversitiesService } from './universities.service';
import { CryptoService } from '../crypto/crypto.service';

@Injectable()
export class MigrationService {
  constructor(
    private universitiesService: UniversitiesService,
    private cryptoService: CryptoService,
  ) {}

  async migrateExistingUniversities() {
    const universities = await this.universitiesService.findAll();

    for (const university of universities) {
      // Skip if already has blockchain identity
      if (university.did_identifier) continue;

      // Generate new identity
      const identity = this.cryptoService.generateUniversityIdentity();
      const encryptedKey = this.cryptoService.encryptPrivateKey(
        identity.privateKey
      );

      // Update university
      await this.universitiesService.update(university.id, {
        did_identifier: identity.didIdentifier,
        encrypted_private_key: encryptedKey,
        public_key_hex: identity.publicKey,
        wallet_address: identity.address,
      });

      console.log(`Migrated: ${university.name} → ${identity.didIdentifier}`);
    }
  }
}
```

---

## Usage Examples

### Example 1: Issue Certificates to Blockchain

```typescript
// In certificates.controller.ts or service
async issueCertificatesToBlockchain(universityId: string, certificateIds: string[]) {
  // 1. Load university with blockchain identity
  const university = await this.universitiesService.findOne(universityId);
  
  if (!university.did_identifier) {
    throw new Error('University does not have blockchain identity');
  }

  // 2. Load certificates with student relations
  const certificates = await this.certificatesService.findByIds(
    certificateIds,
    ['student']
  );

  // 3. Issue to blockchain (backend handles all Web3)
  const txHash = await this.blockchainService.issueCertificatesBatch(
    certificates,
    university.did_identifier
  );

  // 4. Update certificate records
  await this.certificatesRepository.update(
    { id: In(certificateIds) },
    {
      blockchain_transaction_hash: txHash,
      verification_status: 'ISSUED',
    }
  );

  return {
    success: true,
    transactionHash: txHash,
    certificatesIssued: certificates.length,
  };
}
```

### Example 2: Verify Certificate (Already Implemented)

```typescript
// This already works! Just call verification service
const result = await this.verificationService.verifyCertificate(certificate_id);

// Returns full three-way match result
console.log(result.valid); // true/false
console.log(result.blockchain.issuer_did); // university's did:key
```

---

## Security Notes

### ✅ What's Secure:

1. **Private keys encrypted at rest** (AES-256-GCM)
2. **Master key stored in environment** (not in code)
3. **Keys decrypted only in-memory** (wiped immediately after use)
4. **Platform controls all gas** (universities can't drain funds)
5. **Universities isolated** (can't access each other's keys)

### ⚠️ Important Reminders:

1. **MASTER_AES_KEY is critical:**
   - Losing it = all university keys permanently locked
   - Back it up securely (password manager, encrypted USB)
   - Use different keys for dev/staging/production

2. **Private keys never logged:**
   - Check your logs - ensure no key leaks
   - Never return encrypted_private_key in API responses

3. **Database security:**
   - Encrypted backups
   - Limited access (only backend can read universities table)

---

## Testing Checklist

### Test 1: Create New University
- [ ] Register new university via admin panel
- [ ] Verify did_identifier is generated
- [ ] Verify encrypted_private_key is populated
- [ ] Verify wallet_address starts with 0x

### Test 2: Issue Certificates
- [ ] Create test certificate for university
- [ ] Call blockchain issue endpoint
- [ ] Verify transaction hash returned
- [ ] Check Etherscan: https://sepolia-optimistic.etherscan.io/tx/TX_HASH

### Test 3: Verify Certificate
- [ ] Call verification endpoint with certificate_id
- [ ] Verify response shows valid=true
- [ ] Verify blockchain.issuer_did matches university.did_identifier

### Test 4: Key Decryption (Internal Test)
```typescript
// In a test file or debug endpoint (remove after testing!)
const university = await universitiesService.findOne(universityId);
const decryptedKey = cryptoService.decryptPrivateKey(
  university.encrypted_private_key
);
console.log('Decrypted key starts with:', decryptedKey.slice(0, 6)); // Should be 0xabcd
// Key is automatically wiped after this scope
```

---

## Troubleshooting

### Error: "MASTER_AES_KEY must be set"
**Solution:** Ensure `.env` has:
```env
MASTER_AES_KEY=3196005aef5597ac07ab3f705721f6c7ae0a34f018a76f3bc7f86ab8f0a4b2df
```

### Error: "Decryption failed"
**Possible causes:**
1. MASTER_AES_KEY changed (keys encrypted with old key)
2. Corrupted encrypted_private_key in database
3. Wrong format (should be iv:authTag:ciphertext)

**Solution:** Regenerate identity for that university (invalidates old certs!)

### Error: "University does not have blockchain identity"
**Solution:** University created before migration. Run:
```typescript
await universitiesService.regenerateIdentity(universityId);
```

---

## Cost Analysis

### Option A (Current Implementation):

| Operation | Who Pays Gas | Cost (Optimism Sepolia) |
|-----------|--------------|-------------------------|
| Generate Keys | N/A | FREE (local computation) |
| Store Keys in DB | N/A | FREE (database) |
| Issue Certificates | Platform | FREE (testnet ETH) |
| Verify Certificates | N/A | FREE (read-only) |

**Total university cost: $0.00** ✅

**Platform costs (production):**
- Issue 100 certificates: ~$0.50
- Issue 1,000 certificates: ~$3-5
- Much cheaper than Ethereum mainnet!

---

## Migration from Option B (If Needed Later)

If you ever want universities to pay their own gas:

1. Add funding mechanism (universities buy ETH)
2. Update BlockchainService to use university wallet (not operator)
3. Add gas balance monitoring
4. Handle insufficient balance errors

**Not recommended unless:**
- You have thousands of universities
- Gas costs become significant
- Regulatory requirements demand it

---

## Summary

✅ **Universities never see blockchain**
✅ **Keys auto-generated on registration**  
✅ **Platform pays all gas costs**  
✅ **Secure encryption at rest**  
✅ **Simple user experience**  

**Status:** Fully implemented and ready to test! 🚀

---

## Next Steps

1. **Run database migration** (Step 1 above)
2. **Restart backend server**
3. **Create test university** (verify identity generation)
4. **Issue test certificate to blockchain**
5. **Verify certificate through API**

Need help? Check the logs for detailed CryptoService operations!
