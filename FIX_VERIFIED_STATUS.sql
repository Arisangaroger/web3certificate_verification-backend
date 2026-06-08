-- Manual fix: Update all certificates that have blockchain transaction hash to VERIFIED status
-- Run this if certificates were issued to blockchain but status didn't update

UPDATE certificates
SET verification_status = 'VERIFIED'
WHERE blockchain_transaction_hash IS NOT NULL
  AND verification_status != 'VERIFIED';

-- Check the results
SELECT 
    id,
    degree_title,
    verification_status,
    CASE 
        WHEN blockchain_transaction_hash IS NOT NULL THEN 'Has TX Hash'
        ELSE 'No TX Hash'
    END as blockchain_status,
    LEFT(blockchain_transaction_hash, 20) as tx_preview
FROM certificates
ORDER BY created_at DESC
LIMIT 10;

-- Verify counts
SELECT 
    verification_status,
    COUNT(*) as count,
    SUM(CASE WHEN blockchain_transaction_hash IS NOT NULL THEN 1 ELSE 0 END) as with_tx_hash
FROM certificates
GROUP BY verification_status;
