-- Check certificate status and blockchain transaction hashes
SELECT 
    id,
    degree_title,
    verification_status,
    blockchain_transaction_hash,
    created_at
FROM certificates
ORDER BY created_at DESC
LIMIT 10;

-- Count by status
SELECT 
    verification_status,
    COUNT(*) as count
FROM certificates
GROUP BY verification_status;

-- Check certificates that SHOULD be verified (have transaction hash)
SELECT 
    id,
    verification_status,
    blockchain_transaction_hash
FROM certificates
WHERE blockchain_transaction_hash IS NOT NULL;

-- Check for any issues
SELECT 
    COUNT(*) as total_certificates,
    COUNT(blockchain_transaction_hash) as with_tx_hash,
    SUM(CASE WHEN verification_status = 'ISSUED' THEN 1 ELSE 0 END) as issued_count,
    SUM(CASE WHEN verification_status = 'VERIFIED' THEN 1 ELSE 0 END) as verified_count
FROM certificates;
