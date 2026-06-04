# University-Scoped Access Control

## 🎯 Overview

Each university registrar can **ONLY** manage admin users within their own university. There is **NO cross-university access**.

---

## 🔒 How It Works

### 1. **JWT Token Contains University ID**

When an admin logs in, their JWT token includes their `university_id`:

```json
{
  "sub": "admin-uuid",
  "email": "registrar@university.edu",
  "role": "REGISTRAR",
  "type": "admin",
  "university_id": "university-uuid-123"
}
```

### 2. **Every Request is Scoped**

The `@CurrentUser()` decorator extracts the logged-in admin's university ID from the JWT token.

### 3. **Access Control Checks**

Before any operation, the system verifies:
- ✅ Does the target admin user belong to the current user's university?
- ❌ If NO → `403 Forbidden` error

---

## 📋 Endpoint Behavior

### **POST /api/v1/admin-users** (Create Admin)

**Scenario 1: Valid Request**
```json
// Logged-in user: university_id = "uni-123"
// Request body:
{
  "university_id": "uni-123",
  "full_name": "Jane Doe",
  "email": "jane@university.edu",
  "password": "SecurePass123",
  "role": "VIEWER"
}
```
✅ **Result:** Admin created successfully

**Scenario 2: Cross-University Attempt**
```json
// Logged-in user: university_id = "uni-123"
// Request body:
{
  "university_id": "uni-456", // Different university!
  "full_name": "Jane Doe",
  "email": "jane@university.edu",
  "password": "SecurePass123",
  "role": "VIEWER"
}
```
❌ **Result:** `403 Forbidden - You can only create admin users for your own university`

---

### **GET /api/v1/admin-users** (List All Admins)

**Behavior:**
- Automatically filters to show ONLY admins from the logged-in user's university
- No manual filtering needed

**Example:**
```
Logged-in user: university_id = "uni-123"

Response:
[
  {
    "id": "admin-1",
    "email": "admin1@uni123.edu",
    "university_id": "uni-123"
  },
  {
    "id": "admin-2",
    "email": "admin2@uni123.edu",
    "university_id": "uni-123"
  }
]
```

Admins from `uni-456` are **NOT** included.

---

### **GET /api/v1/admin-users/:id** (View Specific Admin)

**Scenario 1: Same University**
```
Logged-in user: university_id = "uni-123"
Request: GET /api/v1/admin-users/admin-1

Admin-1 university_id: "uni-123"
```
✅ **Result:** Admin details returned

**Scenario 2: Different University**
```
Logged-in user: university_id = "uni-123"
Request: GET /api/v1/admin-users/admin-999

Admin-999 university_id: "uni-456"
```
❌ **Result:** `403 Forbidden - You can only view admin users from your own university`

---

### **PATCH /api/v1/admin-users/:id** (Update Admin)

**Access Control:**
- ✅ Can update admins from own university
- ❌ Cannot update admins from other universities

**Example:**
```
Logged-in user: university_id = "uni-123"
Request: PATCH /api/v1/admin-users/admin-999
Body: { "full_name": "Updated Name" }

Admin-999 university_id: "uni-456"
```
❌ **Result:** `403 Forbidden - You can only update admin users from your own university`

---

### **PATCH /api/v1/admin-users/:id/deactivate** (Deactivate Admin)

**Access Control:**
- ✅ Can deactivate admins from own university
- ❌ Cannot deactivate admins from other universities

---

### **PATCH /api/v1/admin-users/:id/activate** (Activate Admin)

**Access Control:**
- ✅ Can activate admins from own university
- ❌ Cannot activate admins from other universities

---

### **DELETE /api/v1/admin-users/:id** (Delete Admin)

**Access Control:**
- ✅ Can delete admins from own university
- ❌ Cannot delete admins from other universities
- ❌ **Cannot delete own account** (self-deletion prevention)

**Example:**
```
Logged-in user: id = "admin-1", university_id = "uni-123"
Request: DELETE /api/v1/admin-users/admin-1
```
❌ **Result:** `403 Forbidden - You cannot delete your own account`

---

## 🔐 Security Implementation

### 1. **JWT Payload Enhancement**

```typescript
// auth.service.ts - loginAdmin()
const payload = { 
  sub: user.id, 
  email: user.email, 
  role: user.role,
  type: 'admin',
  university_id: user.university_id, // ← Added
};
```

### 2. **JWT Strategy Update**

```typescript
// jwt.strategy.ts - validate()
async validate(payload: any) {
  return {
    userId: payload.sub,
    email: payload.email,
    role: payload.role,
    type: payload.type,
    university_id: payload.university_id, // ← Added
  };
}
```

### 3. **CurrentUser Decorator**

```typescript
// current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Contains university_id
  },
);
```

### 4. **Controller Access Checks**

```typescript
// admin-users.controller.ts
@Get(':id')
async findOne(@Param('id') id: string, @CurrentUser() currentUser: any) {
  const adminUser = await this.adminUsersService.findOne(id);
  
  // University scope check
  if (adminUser.university_id !== currentUser.university_id) {
    throw new ForbiddenException('You can only view admin users from your own university');
  }

  return adminUser;
}
```

---

## 🧪 Testing University Isolation

### Test 1: Create Admin for Own University
```bash
# Login as registrar from University A
curl -X POST http://localhost:3000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "registrar@universityA.edu",
    "password": "password123"
  }'

# Use returned JWT token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Create admin for University A (should succeed)
curl -X POST http://localhost:3000/api/v1/admin-users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "university_id": "university-A-uuid",
    "full_name": "New Admin",
    "email": "newadmin@universityA.edu",
    "password": "SecurePass123",
    "role": "VIEWER"
  }'
```
✅ **Expected:** Success (201 Created)

### Test 2: Attempt Cross-University Creation
```bash
# Same registrar from University A
# Try to create admin for University B (should fail)
curl -X POST http://localhost:3000/api/v1/admin-users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "university_id": "university-B-uuid",
    "full_name": "Hacker Admin",
    "email": "hacker@universityB.edu",
    "password": "SecurePass123",
    "role": "REGISTRAR"
  }'
```
❌ **Expected:** 403 Forbidden

### Test 3: View Only Own University Admins
```bash
# List all admins (should only show University A admins)
curl -X GET http://localhost:3000/api/v1/admin-users \
  -H "Authorization: Bearer $TOKEN"
```
✅ **Expected:** Only admins from University A

---

## 📊 Access Control Matrix

| Action | Same University | Different University | No Auth |
|--------|----------------|---------------------|---------|
| Create Admin | ✅ REGISTRAR | ❌ 403 Forbidden | ❌ 401 Unauthorized |
| List Admins | ✅ REGISTRAR, VIEWER | ❌ Auto-filtered | ❌ 401 Unauthorized |
| View Admin | ✅ REGISTRAR, VIEWER | ❌ 403 Forbidden | ❌ 401 Unauthorized |
| Update Admin | ✅ REGISTRAR | ❌ 403 Forbidden | ❌ 401 Unauthorized |
| Deactivate Admin | ✅ REGISTRAR | ❌ 403 Forbidden | ❌ 401 Unauthorized |
| Activate Admin | ✅ REGISTRAR | ❌ 403 Forbidden | ❌ 401 Unauthorized |
| Delete Admin | ✅ REGISTRAR (not self) | ❌ 403 Forbidden | ❌ 401 Unauthorized |

---

## ✅ Summary

**University Isolation Guarantees:**

1. ✅ Each registrar can ONLY see admins from their university
2. ✅ Each registrar can ONLY create admins for their university
3. ✅ Each registrar can ONLY modify admins from their university
4. ✅ Cross-university access attempts return `403 Forbidden`
5. ✅ Self-deletion is prevented
6. ✅ University ID is embedded in JWT token
7. ✅ All operations are automatically scoped by university

**No registrar can access or modify data from another university.**
