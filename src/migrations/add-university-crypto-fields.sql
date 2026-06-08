-- Migration: Add cryptographic fields to universities table
-- Purpose: Store encrypted private keys and public keys for blockchain identity
-- Date: 2026-06-06

-- Add encrypted_private_key column (stores AES-256-GCM encrypted private key)
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS encrypted_private_key TEXT;

-- Add public_key_hex column (stores uncompressed public key in hex format)
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS public_key_hex VARCHAR(132);

-- Add wallet_address column (Ethereum address derived from public key)
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42);

-- Add comment to did_identifier if it doesn't have one
COMMENT ON COLUMN universities.did_identifier IS 'W3C did:key identifier for blockchain verification';
COMMENT ON COLUMN universities.encrypted_private_key IS 'AES-256-GCM encrypted private key (encrypted with MASTER_AES_KEY)';
COMMENT ON COLUMN universities.public_key_hex IS 'Uncompressed public key in hex format (0x04...)';
COMMENT ON COLUMN universities.wallet_address IS 'Ethereum address derived from public key';

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_universities_wallet_address ON universities(wallet_address);

-- Note: did_identifier already has unique constraint from previous migrations
