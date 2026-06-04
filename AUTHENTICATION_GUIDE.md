# Authentication Guide

## Overview

The system implements **two separate authentication flows**:

1. **University Admin Authentication** - Email + Password → JWT
2. **Student Authentication** - Student ID + National ID → OTP → JWT

---

## 1. University Admin Authentication

### Flow
```
Admin enters email + password
    ↓
Backend validates credentials (bcrypt)
    ↓
Returns JWT token (24h expiration)
```

### Endpoint: Admin Login

**POST** `/api/v1/auth/admin/login`

**Request Body:**
```json
{
  "email": "admin@university.edu",
  "password": "SecurePassword123"
}
```

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "admin@university.edu",
    "full_name": "John Doe",
    "role": "REGISTRAR"
  }
}
```

**Error Response (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

### Admin Roles
- **REGISTRAR** - Can upload batches, manage certificates
- **VIEWER** - Read-only access

### Notes
- Passwords are hashed with bcrypt
- JWT expires in 24 hours
- Admin accounts must be created directly in the database (no signup endpoint for security)

---

## 2. Student Authentication (OTP-Based)

### Flow
```
Student enters student_id_number + national_id
    ↓
Backend validates identity
    ↓
Generates 6-digit OTP (5-minute expiration)
    ↓
Sends OTP via SMS + Email
    ↓
Student enters OTP
    ↓
Backend verifies OTP
    ↓
Returns JWT token (24h expiration)
```

### Step 1: Request OTP

**POST** `/api/v1/auth/student/request-otp`

**Request Body:**
```json
{
  "student_id_number": "STU2024001",
  "national_id": "1234567890123"
}
```

**Success Response (200):**
```json
{
  "message": "OTP sent successfully to your phone and email",
  "expiresIn": 300
}
```

**Error Response (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

### Step 2: Verify OTP

**POST** `/api/v1/auth/student/verify-otp`

**Request Body:**
```json
{
  "student_id_number": "STU2024001",
  "national_id": "1234567890123",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "student": {
    "id": "uuid-here",
    "full_name": "Jane Smith",
    "student_id_number": "STU2024001",
    "email": "jane.smith@university.edu"
  }
}
```

**Error Responses:**

**Invalid OTP (400):**
```json
{
  "statusCode": 400,
  "message": "Invalid OTP"
}
```

**Expired OTP (400):**
```json
{
  "statusCode": 400,
  "message": "OTP has expired. Please request a new one."
}
```

**OTP Not Found (400):**
```json
{
  "statusCode": 400,
  "message": "OTP not found or expired. Please request a new one."
}
```

### OTP Details
- **Length**: 6 digits
- **Expiration**: 5 minutes
- **Delivery**: SMS + Email (simultaneous)
- **Storage**: In-memory (Map) - cleared after verification or expiration

---

## 3. Using JWT Tokens

### Include in Request Headers

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### JWT Payload Structure

**Admin Token:**
```json
{
  "sub": "user-uuid",
  "email": "admin@university.edu",
  "role": "REGISTRAR",
  "type": "admin",
  "iat": 1234567890,
  "exp": 1234654290
}
```

**Student Token:**
```json
{
  "sub": "student-uuid",
  "student_id_number": "STU2024001",
  "type": "student",
  "iat": 1234567890,
  "exp": 1234654290
}
```

---

## 4. University Signup (Admin Creation)

### Important: No Public Signup Endpoint

For security reasons, **university admin accounts are NOT created via API**. They must be inserted directly into the database by a system administrator.

### Manual Admin Creation (SQL)

```sql
INSERT INTO institution_admins (
  id,
  university_id,
  full_name,
  email,
  password_hash,
  role,
  is_active,
  created_at
) VALUES (
  gen_random_uuid(),
  'university-uuid-here',
  'John Doe',
  'admin@university.edu',
  '$2b$10$hashed_password_here', -- Use bcrypt to hash password
  'REGISTRAR',
  true,
  CURRENT_TIMESTAMP
);
```

### Generate Password Hash (Node.js)

```javascript
const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const hash = await bcrypt.hash(password, 10);
  console.log(hash);
}

hashPassword('YourSecurePassword123');
```

### Alternative: Create Admin Seeder Script

You can create a NestJS seeder command to add admin users programmatically during deployment.

---

## 5. Protected Routes

### Role-Based Access Control

```typescript
// Admin-only endpoint
@Roles('REGISTRAR')
@Post('file-upload/batch')
async uploadBatch() { ... }

// Any authenticated user
@UseGuards(JwtAuthGuard)
@Get('certificates/student/:id')
async getCertificates() { ... }

// Public endpoint
@Public()
@Get('verification/:certificate_id')
async verify() { ... }
```

---

## 6. Security Features

✅ **Password Security**
- Bcrypt hashing with salt rounds = 10
- Passwords never stored in plain text

✅ **OTP Security**
- 6-digit random generation
- 5-minute expiration
- Single-use (deleted after verification)
- Dual-channel delivery (SMS + Email)

✅ **JWT Security**
- 24-hour expiration
- Signed with secret key
- Contains minimal user data

✅ **Input Validation**
- class-validator decorators
- DTO validation on all endpoints

✅ **Rate Limiting**
- Recommended: Add throttler for OTP requests
- Prevent brute-force attacks

---

## 7. Testing Authentication

### Test Admin Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@university.edu",
    "password": "SecurePassword123"
  }'
```

### Test Student OTP Flow
```bash
# Step 1: Request OTP
curl -X POST http://localhost:3000/api/v1/auth/student/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "student_id_number": "STU2024001",
    "national_id": "1234567890123"
  }'

# Step 2: Verify OTP (check SMS/Email for code)
curl -X POST http://localhost:3000/api/v1/auth/student/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "student_id_number": "STU2024001",
    "national_id": "1234567890123",
    "otp": "123456"
  }'
```

### Test Protected Endpoint
```bash
curl -X GET http://localhost:3000/api/v1/certificates/student/uuid-here \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## 8. Environment Variables Required

```env
# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production

# SMS Service (for OTP)
SMS_API_URL=https://api.sms.provider.com/v1/send
SMS_API_KEY=your_sms_api_key

# Email Service (for OTP)
EMAIL_API_URL=https://api.email.provider.com/v1/send
EMAIL_API_KEY=your_email_api_key
```

---

## Summary

✅ **Admin Login**: Email + Password → JWT (Direct)  
✅ **Student Login**: Student ID + National ID → OTP → JWT (Two-step)  
✅ **No Public Signup**: Admin accounts created manually in DB  
✅ **JWT Expiration**: 24 hours  
✅ **OTP Expiration**: 5 minutes  
✅ **Role-Based Access**: REGISTRAR vs VIEWER
