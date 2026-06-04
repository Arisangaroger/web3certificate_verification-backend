#!/usr/bin/env node

/**
 * Generate Bcrypt Hash for Super Admin Password
 * 
 * Usage:
 *   node generate-super-admin-hash.js
 *   
 * Then enter your password when prompted.
 */

const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

console.log('='.repeat(60));
console.log('Super Admin Password Hash Generator');
console.log('='.repeat(60));
console.log('');
console.log('Enter the password for your super admin account:');

rl.question('Password: ', async (password) => {
  if (!password || password.length < 8) {
    console.error('\n❌ Error: Password must be at least 8 characters long');
    process.exit(1);
  }

  try {
    console.log('\n⏳ Generating bcrypt hash (10 rounds)...\n');
    
    const hash = await bcrypt.hash(password, 10);
    
    console.log('✅ Hash generated successfully!\n');
    console.log('='.repeat(60));
    console.log('Your Bcrypt Hash:');
    console.log('='.repeat(60));
    console.log(hash);
    console.log('='.repeat(60));
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Copy the hash above');
    console.log('2. Open create-super-admin.sql');
    console.log('3. Replace $2b$10$REPLACE_WITH_YOUR_BCRYPT_HASH with your hash');
    console.log('4. Change the email address');
    console.log('5. Run the SQL script in your PostgreSQL database');
    console.log('');
    console.log('🔐 Keep your password safe!');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error generating hash:', error.message);
    process.exit(1);
  }
  
  rl.close();
});
