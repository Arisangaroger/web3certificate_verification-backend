# Quick Migration Guide

## Run This Single Command:

### Windows (PowerShell):
```powershell
$env:PGPASSWORD="Arisanga@123"; psql -U postgres -d CertificateVerificationDB -f src/migrations/add-university-crypto-fields.sql
```

### Linux/Mac:
```bash
PGPASSWORD='Arisanga@123' psql -U postgres -d CertificateVerificationDB -f src/migrations/add-university-crypto-fields.sql
```

### Or Using pgAdmin:
1. Open pgAdmin
2. Connect to `CertificateVerificationDB`
3. Open Query Tool (Tools → Query Tool)
4. Copy-paste this SQL:

```sql
-- Add cryptographic fields to universities table
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS encrypted_private_key TEXT,
ADD COLUMN IF NOT EXISTS public_key_hex VARCHAR(132),
ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42);

-- Add comments
COMMENT ON COLUMN universities.encrypted_private_key IS 'AES-256-GCM encrypted private key';
COMMENT ON COLUMN universities.public_key_hex IS 'Uncompressed public key in hex format';
COMMENT ON COLUMN universities.wallet_address IS 'Ethereum address derived from public key';

-- Create index
CREATE INDEX IF NOT EXISTS idx_universities_wallet_address ON universities(wallet_address);
```

5. Click Execute (F5)

## Verify Migration:

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'universities' 
AND column_name IN ('encrypted_private_key', 'public_key_hex', 'wallet_address');
```

Should return 3 rows.

## Done! ✅

Now restart your NestJS server:
```bash
npm run start:dev
```
