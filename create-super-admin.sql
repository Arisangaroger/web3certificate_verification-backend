-- =====================================================
-- Create First Super Admin (Bootstrap Script)
-- =====================================================
-- 
-- This script creates the first super admin account.
-- Run this ONCE to bootstrap your system.
--
-- IMPORTANT: Change the email and password hash before running!
-- =====================================================

-- Step 1: Generate a bcrypt hash for your password
-- You can use Node.js:
--   const bcrypt = require('bcrypt');
--   bcrypt.hashSync('YourSecurePassword123!', 10);
--
-- Or use an online bcrypt generator (with 10 rounds)

-- Step 2: Replace the values below and run this script

INSERT INTO institution_admins (
  id, 
  email, 
  password_hash, 
  full_name, 
  role, 
  university_id, 
  is_active,
  created_at
) VALUES (
  gen_random_uuid(),
  'superadmin@yourdomain.com',  -- ← CHANGE THIS
  '$2b$10$REPLACE_WITH_YOUR_BCRYPT_HASH',  -- ← CHANGE THIS
  'System Super Administrator',  -- ← CHANGE THIS (optional)
  'SUPER_ADMIN',
  NULL,  -- Super admin has no university
  true,
  NOW()
);

-- Verify the super admin was created
SELECT 
  id, 
  email, 
  full_name, 
  role, 
  university_id, 
  is_active, 
  created_at 
FROM institution_admins 
WHERE role = 'SUPER_ADMIN';
