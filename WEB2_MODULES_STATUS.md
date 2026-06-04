# Web2 Modules - Readiness Status

## ✅ READY TO TEST (100%)

### **1. Auth Module** ✅
**Endpoints:**
- `POST /api/v1/auth/admin/login` - Admin login (email + password)
- `POST /api/v1/auth/student/request-otp` - Student requests OTP
- `POST /api/v1/auth/student/verify-otp` - Student verifies OTP and gets JWT

**Features:**
- ✅ JWT authentication
- ✅ Email OTP (via Brevo SMTP)
- ✅ Password hashing (bcrypt)
- ✅ University-scoped admin access

**Requirements:**
- Database with admin_users and students
- Brevo SMTP credentials in `.env`

---

### **2. Universities Module** ✅
**Endpoints:**
- `GET /api/v1/universities` - List all universities (public)
- `GET /api/v1/universities/:id` - Get university details (public)

**Features:**
- ✅ Public access (no auth required)
- ✅ Basic CRUD operations

**Requirements:**
- Database with universities table populated

---

### **3. Students Module** ✅
**Endpoints:**
- `GET /api/v1/students/profile` - Get logged-in student's profile (JWT required)
- `GET /api/v1/students/:id` - Get student by ID (JWT required)

**Features:**
- ✅ JWT-protected endpoints
- ✅ Profile access
- ✅ Bulk creation (used by file upload)

**Requirements:**
- Valid JWT token
- Database with students

---

### **4. Admin Users Module** ✅
**Endpoints:**
- `POST /api/v1/admin-users` - Create admin user (REGISTRAR only)
- `GET /api/v1/admin-users` - List admins (university-scoped)
- `GET /api/v1/admin-users/:id` - Get admin details
- `PATCH /api/v1/admin-users/:id` - Update admin
- `PATCH /api/v1/admin-users/:id/activate` - Activate admin
- `PATCH /api/v1/admin-users/:id/deactivate` - Deactivate admin
- `DELETE /api/v1/admin-users/:id` - Delete admin

**Features:**
- ✅ University-scoped access (registrar can only manage own university)
- ✅ Role-based access (REGISTRAR, VIEWER)
- ✅ Self-deletion prevention
- ✅ Password hashing

**Requirements:**
- Valid admin JWT token
- REGISTRAR role for write operations

---

### **5. Certificates Module** ✅
**Endpoints:**
- `GET /api/v1/certificates/student/:studentId` - Get student's certificates

**Features:**
- ✅ List certificates by student
- ✅ Bulk creation (used by file upload)
- ✅ Certificate ID generation (12-char NanoID)

**Requirements:**
- Valid JWT token
- Database with certificates

---

### **6. File Upload Module** ✅
**Endpoints:**
- `POST /api/v1/file-upload/batch` - Upload CSV batch (REGISTRAR only)

**Features:**
- ✅ CSV stream parsing (memory efficient)
- ✅ Automatic student deduplication
- ✅ Multiple certificates per student support
- ✅ Transactional processing

**Requirements:**
- Valid admin JWT token (REGISTRAR role)
- CSV file following the template
- University ID in request

---

### **7. Notification Module** ✅
**Features:**
- ✅ Email sending via Brevo SMTP
- ✅ OTP generation (6 digits)
- ✅ HTML-formatted emails
- ✅ Used by auth module for OTP

**Requirements:**
- Brevo SMTP credentials in `.env`

---

### **8. PDF Generator Module** ✅
**Features:**
- ✅ HTML to PDF conversion (Puppeteer)
- ✅ QR code embedding
- ✅ Certificate template rendering

**Requirements:**
- Chrome/Chromium installed
- `PUPPETEER_EXECUTABLE_PATH` in `.env`

---

### **9. QR Code Module** ✅
**Features:**
- ✅ QR code generation (data URL and buffer)
- ✅ Used by PDF generator

**Requirements:**
- None (standalone)

---

## ⚠️ NOT READY (Blockchain-Dependent)

### **10. Blockchain Module** ❌ **NOT TESTABLE YET**
**Reason:** Requires smart contract deployment on Optimism

**Features:**
- Keccak-256 hash generation
- Register certificates on blockchain
- Verify certificates from blockchain

**Requirements:**
- Deployed smart contract
- Wallet private key
- Optimism RPC URL

---

### **11. Verification Module** ⚠️ **PARTIALLY TESTABLE**
**Endpoint:**
- `GET /api/v1/verification/:certificate_id` - Verify certificate (public)

**Status:**
- ✅ Database hash verification works
- ❌ Blockchain verification requires smart contract

**Can test:**
- Database hash matching
- Certificate lookup

**Cannot test:**
- Blockchain verification
- Three-way hash validation

---

## 📋 Testing Checklist

### **Prerequisites:**
1. ✅ Database running and tables created
2. ✅ At least one university in database
3. ✅ At least one admin user in database
4. ✅ Brevo SMTP credentials configured
5. ✅ `.env` file properly configured

### **Test Order:**

**Step 1: Public Endpoints**
```bash
# Test universities list
curl http://localhost:3000/api/v1/universities
```

**Step 2: Admin Authentication**
```bash
# Admin login
curl -X POST http://localhost:3000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@university.edu",
    "password": "your_password"
  }'
```

**Step 3: Admin Operations (use JWT from step 2)**
```bash
# List admin users
curl http://localhost:3000/api/v1/admin-users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Step 4: File Upload**
```bash
# Upload CSV batch
curl -X POST http://localhost:3000/api/v1/file-upload/batch \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@students.csv" \
  -F "university_id=university-uuid"
```

**Step 5: Student Authentication**
```bash
# Request OTP
curl -X POST http://localhost:3000/api/v1/auth/student/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "student_id_number": "ST001",
    "national_id": "1234567890"
  }'

# Verify OTP (check email for code)
curl -X POST http://localhost:3000/api/v1/auth/student/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "student_id_number": "ST001",
    "national_id": "1234567890",
    "otp": "123456"
  }'
```

**Step 6: Student Operations**
```bash
# Get student profile
curl http://localhost:3000/api/v1/students/profile \
  -H "Authorization: Bearer STUDENT_JWT_TOKEN"

# Get student certificates
curl http://localhost:3000/api/v1/certificates/student/student-uuid \
  -H "Authorization: Bearer STUDENT_JWT_TOKEN"
```

---

## ✅ Summary

**READY TO TEST (Web2 only):**
1. ✅ Authentication (Admin & Student)
2. ✅ Universities (Public access)
3. ✅ Students (Profile & lookup)
4. ✅ Admin Users (CRUD with university scope)
5. ✅ Certificates (Listing)
6. ✅ File Upload (CSV batch processing)
7. ✅ Email Notifications (OTP)
8. ✅ PDF Generation (Certificate rendering)
9. ✅ QR Code Generation

**NOT READY (Blockchain required):**
1. ❌ Blockchain registration
2. ⚠️ Full certificate verification (partial only)

**All Web2 modules are 100% ready for testing in Postman!**

The only features that won't work are:
- Blockchain hash anchoring
- Blockchain-based verification

Everything else (authentication, file upload, admin management, student access) is fully functional.
