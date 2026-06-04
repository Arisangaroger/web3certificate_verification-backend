# Disabled Modules - Blockchain & Verification

## 🔒 Currently Disabled

The following modules have been **temporarily disabled** from the application until blockchain infrastructure is ready:

### **1. Blockchain Module** ❌ DISABLED
**Location:** `src/modules/blockchain/`

**Why Disabled:**
- Requires deployed smart contract on Optimism
- Needs wallet private key configuration
- Depends on external blockchain infrastructure

**Files Preserved:**
- ✅ `blockchain.service.ts` - Keccak-256 hashing, contract interaction
- ✅ `blockchain.module.ts` - Module configuration

**When to Re-enable:**
1. Deploy smart contract to Optimism
2. Add contract address to `.env`
3. Add wallet private key to `.env`
4. Uncomment in `app.module.ts`
5. Uncomment in `file-upload.module.ts`
6. Uncomment in `certificates.module.ts`
7. Uncomment in `verification.module.ts`

---

### **2. Verification Module** ❌ DISABLED
**Location:** `src/modules/verification/`

**Why Disabled:**
- Depends on BlockchainModule for three-way verification
- Cannot perform blockchain hash verification without smart contract

**Files Preserved:**
- ✅ `verification.service.ts` - Three-way verification logic
- ✅ `verification.controller.ts` - Public verification endpoint
- ✅ `verification.module.ts` - Module configuration

**When to Re-enable:**
1. Re-enable BlockchainModule first
2. Uncomment in `app.module.ts`
3. Test verification endpoint

---

## ✅ What Still Works

All Web2 functionality remains **fully operational**:

1. ✅ **Authentication**
   - Admin login (email + password)
   - Student login (OTP via email)
   - JWT token generation

2. ✅ **Admin Management**
   - Create/read/update/delete admin users
   - University-scoped access control
   - Role-based permissions (REGISTRAR/VIEWER)

3. ✅ **File Upload**
   - CSV batch processing
   - Student deduplication
   - Multiple certificates per student
   - Certificate ID generation

4. ✅ **Certificates**
   - List student certificates
   - Database storage
   - PDF generation (with QR codes)

5. ✅ **Students**
   - Profile access
   - Student lookup
   - Bulk creation

6. ✅ **Universities**
   - List all universities
   - View university details

7. ✅ **Email Notifications**
   - OTP sending via Brevo SMTP
   - HTML-formatted emails

---

## 📋 Re-enabling Instructions

### **Step 1: Deploy Smart Contract**

```solidity
// Deploy to Optimism and get contract address
// Add to .env:
CONTRACT_ADDRESS=0x...
WALLET_PRIVATE_KEY=0x...
OPTIMISM_RPC_URL=https://mainnet.optimism.io
```

### **Step 2: Uncomment in app.module.ts**

```typescript
// Change this:
// import { BlockchainModule } from './modules/blockchain/blockchain.module'; // DISABLED
// import { VerificationModule } from './modules/verification/verification.module'; // DISABLED

// To this:
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { VerificationModule } from './modules/verification/verification.module';

// And in imports array:
imports: [
  // ...
  BlockchainModule, // ENABLED
  VerificationModule, // ENABLED
  // ...
]
```

### **Step 3: Uncomment in Related Modules**

**file-upload.module.ts:**
```typescript
import { BlockchainModule } from '../blockchain/blockchain.module';

imports: [
  StudentsModule, 
  CertificatesModule, 
  BlockchainModule // ENABLED
],
```

**certificates.module.ts:**
```typescript
import { BlockchainModule } from '../blockchain/blockchain.module';

imports: [
  TypeOrmModule.forFeature([Certificate]),
  BlockchainModule, // ENABLED
  PdfGeneratorModule,
],
```

### **Step 4: Test Blockchain Integration**

```bash
# Start server
npm run start:dev

# Test verification endpoint
curl http://localhost:3000/api/v1/verification/CERT-ID-HERE
```

---

## 🔐 Environment Variables Needed (When Re-enabling)

```env
# Blockchain (Optimism) - Currently not used
OPTIMISM_RPC_URL=https://mainnet.optimism.io
WALLET_PRIVATE_KEY=0x_your_private_key_here
CONTRACT_ADDRESS=0x_your_contract_address_here
```

---

## ⚠️ Impact of Disabling

### **What Doesn't Work:**
- ❌ Blockchain hash anchoring during CSV upload
- ❌ Three-way certificate verification (runtime hash ↔ DB hash ↔ blockchain hash)
- ❌ Public verification via QR code scan

### **What Still Works:**
- ✅ All authentication flows
- ✅ File upload and certificate creation
- ✅ Certificate storage in database
- ✅ PDF generation with QR codes
- ✅ Admin and student management
- ✅ Everything else!

---

## 📊 Module Status Summary

| Module | Status | Can Test | Notes |
|--------|--------|----------|-------|
| Auth | ✅ Active | ✅ Yes | Fully functional |
| Universities | ✅ Active | ✅ Yes | Fully functional |
| Students | ✅ Active | ✅ Yes | Fully functional |
| Admin Users | ✅ Active | ✅ Yes | Fully functional |
| Certificates | ✅ Active | ✅ Yes | Fully functional |
| File Upload | ✅ Active | ✅ Yes | Fully functional |
| Notification | ✅ Active | ✅ Yes | Fully functional |
| PDF Generator | ✅ Active | ✅ Yes | Fully functional |
| QR Code | ✅ Active | ✅ Yes | Fully functional |
| **Blockchain** | ❌ Disabled | ❌ No | Awaiting smart contract |
| **Verification** | ❌ Disabled | ❌ No | Depends on blockchain |

---

## ✅ Conclusion

The application is **fully functional for all Web2 features**. Blockchain integration is preserved but disabled until the smart contract infrastructure is ready.

**To re-enable:** Simply uncomment the imports and module registrations in the files listed above.
