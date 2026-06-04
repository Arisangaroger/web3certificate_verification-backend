# Super Admin Setup & Usage Guide

## 🎯 Overview

The **Super Admin** is the highest privilege role in the system with the following capabilities:

- ✅ Create, update, and delete universities
- ✅ Create registrar accounts for any university
- ✅ View and manage all admin users across all universities
- ✅ No university restrictions (university_id is NULL)
- ✅ Bypass all university-scoped permission checks

---

## 🔧 Initial Setup (Bootstrap First Super Admin)

### **Step 1: Create Super Admin in Database**

The first super admin must be created manually in the database. This is a one-time bootstrap step.

#### **Option A: Using SQL**

```sql
-- First, hash your password using bcrypt (10 rounds)
-- You can use an online bcrypt generator or Node.js:
-- bcrypt.hashSync('YourSecurePassword123!', 10)

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
  'superadmin@system.com',
  '$2b$10$YourBcryptHashedPasswordHere', -- Replace with actual bcrypt hash
  'System Super Administrator',
  'SUPER_ADMIN',
  NULL, -- Super admin has no university
  true,
  NOW()
);
```

#### **Option B: Using Node.js Script**

Create a file `create-super-admin.js`:

```javascript
const bcrypt = require('bcrypt');

async function generateHash(password) {
  const hash = await bcrypt.hash(password, 10);
  console.log('Bcrypt Hash:', hash);
}

// Replace 'YourSecurePassword123!' with your actual password
generateHash('YourSecurePassword123!');
```

Run it:
```bash
node create-super-admin.js
```

Then use the generated hash in the SQL INSERT statement above.

---

## 🔐 Super Admin Login

The super admin uses the **same login endpoint** as regular admins.

### **Endpoint:**
```
POST /api/v1/auth/admin/login
```

### **Request:**
```json
{
  "email": "superadmin@system.com",
  "password": "YourSecurePassword123!"
}
```

### **Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "superadmin@system.com",
    "full_name": "System Super Administrator",
    "role": "SUPER_ADMIN",
    "university_id": null
  }
}
```

**Note:** `university_id` is `null` for super admins.

---

## 📋 Super Admin Capabilities

### **1. University Management**

#### **Create University**
```
POST /api/v1/universities
Authorization: Bearer <SUPER_ADMIN_JWT>
```

**Request Body:**
```json
{
  "name": "Harvard University",
  "email": "admin@harvard.edu",
  "phone_number": "+1-617-495-1000",
  "wallet_address": "0x1234567890abcdef1234567890abcdef12345678",
  "did_identifier": "did:example:harvard",
  "logo_url": "https://example.com/harvard-logo.png"
}
```

**Response:**
```json
{
  "id": "university-uuid",
  "name": "Harvard University",
  "email": "admin@harvard.edu",
  "phone_number": "+1-617-495-1000",
  "wallet_address": "0x1234567890abcdef1234567890abcdef12345678",
  "did_identifier": "did:example:harvard",
  "logo_url": "https://example.com/harvard-logo.png",
  "created_at": "2026-06-03T10:00:00.000Z"
}
```

#### **Update University**
```
PATCH /api/v1/universities/:id
Authorization: Bearer <SUPER_ADMIN_JWT>
```

**Request Body:**
```json
{
  "name": "Harvard University (Updated)",
  "phone_number": "+1-617-495-2000"
}
```

#### **Delete University**
```
DELETE /api/v1/universities/:id
Authorization: Bearer <SUPER_ADMIN_JWT>
```

⚠️ **Warning:** Deleting a university will cascade delete all:
- Admin users
- Students
- Certificates

---

### **2. Create Registrars for Any University**

Super admin can create registrar accounts for any university (not restricted to own university).

```
POST /api/v1/admin-users
Authorization: Bearer <SUPER_ADMIN_JWT>
```

**Request Body:**
```json
{
  "university_id": "harvard-university-uuid",
  "full_name": "John Doe",
  "email": "john.doe@harvard.edu",
  "password": "SecurePassword123!",
  "role": "REGISTRAR"
}
```

**Response:**
```json
{
  "id": "admin-uuid",
  "university_id": "harvard-university-uuid",
  "full_name": "John Doe",
  "email": "john.doe@harvard.edu",
  "role": "REGISTRAR",
  "is_active": true,
  "created_at": "2026-06-03T10:00:00.000Z"
}
```

---

### **3. View All Admin Users**

Super admin can see **all admin users** across all universities.

```
GET /api/v1/admin-users
Authorization: Bearer <SUPER_ADMIN_JWT>
```

**Response:**
```json
[
  {
    "id": "admin-1-uuid",
    "email": "john@harvard.edu",
    "full_name": "John Doe",
    "role": "REGISTRAR",
    "university_id": "harvard-uuid",
    "is_active": true,
    "created_at": "2026-06-03T10:00:00.000Z"
  },
  {
    "id": "admin-2-uuid",
    "email": "jane@mit.edu",
    "full_name": "Jane Smith",
    "role": "REGISTRAR",
    "university_id": "mit-uuid",
    "is_active": true,
    "created_at": "2026-06-03T10:00:00.000Z"
  }
]
```

---

### **4. Manage Any Admin User**

Super admin can update, activate, deactivate, or delete any admin user regardless of university.

#### **Update Any Admin**
```
PATCH /api/v1/admin-users/:id
Authorization: Bearer <SUPER_ADMIN_JWT>
```

#### **Activate/Deactivate**
```
PATCH /api/v1/admin-users/:id/activate
PATCH /api/v1/admin-users/:id/deactivate
Authorization: Bearer <SUPER_ADMIN_JWT>
```

#### **Delete Any Admin**
```
DELETE /api/v1/admin-users/:id
Authorization: Bearer <SUPER_ADMIN_JWT>
```

---

## 🔄 Typical Workflow

### **Onboarding a New University**

```
1. Super Admin Login
   ↓
2. Create University Record
   POST /api/v1/universities
   ↓
3. Create First Registrar for That University
   POST /api/v1/admin-users
   ↓
4. Send Credentials to Registrar
   (via email or secure channel)
   ↓
5. Registrar Logs In
   POST /api/v1/auth/admin/login
   ↓
6. Registrar Manages Their University
   - Create more admin users
   - Upload student certificates
   - Manage students
```

---

## 🔒 Security Considerations

### **Best Practices:**

1. **Strong Password**: Use a strong password (min 16 characters, mixed case, numbers, symbols)
2. **Limit Super Admins**: Only create 1-2 super admin accounts
3. **Secure Storage**: Store super admin credentials in a secure password manager
4. **Regular Audits**: Periodically review super admin activity
5. **2FA (Future)**: Consider implementing 2FA for super admin accounts

### **What Super Admin CANNOT Do:**

- ❌ Delete their own account
- ❌ Login as a student (different authentication flow)
- ❌ Bypass public endpoints (still follow public decorator rules)

---

## 🆚 Role Comparison

| Feature | SUPER_ADMIN | REGISTRAR | VIEWER |
|---------|-------------|-----------|---------|
| Manage Universities | ✅ All | ❌ None | ❌ None |
| Create Admin Users | ✅ Any University | ✅ Own University Only | ❌ None |
| View Admin Users | ✅ All Universities | ✅ Own University Only | ✅ Own University Only |
| Update Admin Users | ✅ Any University | ✅ Own University Only | ❌ None |
| Delete Admin Users | ✅ Any University | ✅ Own University Only | ❌ None |
| Upload Certificates | ✅ Any University | ✅ Own University Only | ❌ None |
| View Certificates | ✅ All | ✅ Own University Only | ✅ Own University Only |
| University Scope | 🌐 Global | 🏛️ Single University | 🏛️ Single University |

---

## 🧪 Testing Super Admin

### **1. Test Login**
```bash
curl -X POST http://localhost:3000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@system.com",
    "password": "YourSecurePassword123!"
  }'
```

### **2. Test Create University**
```bash
curl -X POST http://localhost:3000/api/v1/universities \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test University",
    "email": "admin@test.edu",
    "phone_number": "+1-555-1234"
  }'
```

### **3. Test Create Registrar**
```bash
curl -X POST http://localhost:3000/api/v1/admin-users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "university_id": "UNIVERSITY_UUID_FROM_STEP_2",
    "full_name": "Test Registrar",
    "email": "registrar@test.edu",
    "password": "TestPassword123!",
    "role": "REGISTRAR"
  }'
```

### **4. Test View All Admins**
```bash
curl http://localhost:3000/api/v1/admin-users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📊 Database Schema Changes

The following changes support super admin:

### **AdminRole Enum**
```typescript
enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',  // ← NEW
  REGISTRAR = 'REGISTRAR',
  VIEWER = 'VIEWER',
}
```

### **institution_admins Table**
```sql
university_id UUID NULL  -- Changed from NOT NULL to allow super admin
```

---

## ✅ Summary

- ✅ `SUPER_ADMIN` role added to enum
- ✅ `university_id` is nullable for super admins
- ✅ Roles guard updated to grant super admin access to everything
- ✅ University CRUD endpoints created (CREATE, UPDATE, DELETE)
- ✅ DTOs created for university management
- ✅ Admin-users controller updated to allow super admin to manage any university's admins
- ✅ Super admin uses same login endpoint as regular admins

**You're ready to use the super admin functionality!**
