-- Script to remove spaces from national_id column in student table
-- Run this in your PostgreSQL database to fix existing records

-- First, let's see what we have
SELECT id, student_id_number, national_id, 
       REPLACE(national_id, ' ', '') as cleaned_national_id
FROM student
WHERE national_id LIKE '% %';

-- Update all records to remove spaces from national_id
UPDATE student
SET national_id = REPLACE(national_id, ' ', '')
WHERE national_id LIKE '% %';

-- Verify the update
SELECT id, student_id_number, national_id
FROM student
ORDER BY created_at DESC
LIMIT 10;
