-- Check current data_hash values
SELECT 
    c.id,
    c.degree_title,
    c.data_hash,
    LENGTH(c.data_hash) as hash_length,
    s.student_id_number,
    s.national_id,
    s.full_name
FROM certificates c
JOIN student s ON s.id = c.student_id
LIMIT 5;

-- If data_hash is NULL or wrong format, you need to regenerate them
-- The backend will need to recalculate these using keccak256

-- Check which certificates need hash regeneration
SELECT 
    COUNT(*) as total_certificates,
    COUNT(data_hash) as with_hash,
    SUM(CASE WHEN LENGTH(data_hash) != 66 THEN 1 ELSE 0 END) as wrong_format
FROM certificates;
