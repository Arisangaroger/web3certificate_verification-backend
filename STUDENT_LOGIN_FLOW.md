# Student Login Flow - Complete Walkthrough

## 🎯 Overview
Students log in using a **two-step OTP verification process** without passwords.

---

## 📋 Step-by-Step Process

### **STEP 1: Student Initiates Login**

**What the student does:**
- Opens the login page
- Enters two pieces of information:
  1. **Student ID Number** (e.g., `STU2024001`)
  2. **National ID** (e.g., `1234567890123`)
- Clicks "Request OTP" button

**Frontend sends:**
```http
POST /api/v1/auth/student/request-otp
Content-Type: application/json

{
  "student_id_number": "STU2024001",
  "national_id": "1234567890123"
}
```

---

### **STEP 2: Backend Validates Identity**

**What happens in the backend:**

```typescript
// 1. Query database to find student
const student = await studentsRepository.findOne({
  where: { 
    student_id_number: "STU2024001",
    national_id: "1234567890123"
  }
});

// 2. If student not found → Return error
if (!student) {
  throw new UnauthorizedException('Invalid credentials');
}

// 3. If student found → Continue to OTP generation
```

**Database Query:**
```sql
SELECT * FROM student 
WHERE student_id_number = 'STU2024001' 
  AND national_id = '1234567890123';
```

**Result:**
```json
{
  "id": "uuid-abc-123",
  "student_id_number": "STU2024001",
  "national_id": "1234567890123",
  "full_name": "Jane Smith",
  "email": "jane.smith@university.edu",
  "phone": "+250788123456"
}
```

---

### **STEP 3: System Generates OTP**

**OTP Generation Code:**
```typescript
generateOTP(): string {
  // Generates random 6-digit number between 100000 and 999999
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```

**Example OTP Generated:** `456789`

---

### **STEP 4: System Stores OTP Temporarily**

**In-Memory Storage:**
```typescript
// Create unique key from student credentials
const key = "STU2024001-1234567890123";

// Store OTP with metadata
otpStore.set(key, {
  otp: "456789",
  studentId: "uuid-abc-123",
  expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
});
```

**Memory Structure:**
```
otpStore (Map):
┌─────────────────────────────────────┬──────────────────────────────┐
│ Key                                 │ Value                        │
├─────────────────────────────────────┼──────────────────────────────┤
│ "STU2024001-1234567890123"          │ {                            │
│                                     │   otp: "456789",             │
│                                     │   studentId: "uuid-abc-123", │
│                                     │   expiresAt: "2024-01-15..." │
│                                     │ }                            │
└─────────────────────────────────────┴──────────────────────────────┘
```

---

### **STEP 5: System Sends OTP via SMS & Email**

**Dual-Channel Delivery:**

**A) SMS Message:**
```typescript
await axios.post(process.env.SMS_API_URL, {
  to: "+250788123456",
  message: "Your verification code is: 456789. Valid for 5 minutes."
}, {
  headers: {
    'Authorization': 'Bearer YOUR_SMS_API_KEY'
  }
});
```

**B) Email Message:**
```typescript
await axios.post(process.env.EMAIL_API_URL, {
  to: "jane.smith@university.edu",
  subject: "Verification Code",
  body: "Your verification code is: 456789. Valid for 5 minutes."
}, {
  headers: {
    'Authorization': 'Bearer YOUR_EMAIL_API_KEY'
  }
});
```

**Both sent simultaneously using `Promise.all()`**

**Student receives:**
- 📱 **SMS on phone:** "Your verification code is: 456789. Valid for 5 minutes."
- 📧 **Email in inbox:** Same message

---

### **STEP 6: Backend Responds to Frontend**

**Response:**
```json
{
  "message": "OTP sent successfully to your phone and email",
  "expiresIn": 300
}
```

**Frontend shows:**
- ✅ Success message
- ⏱️ Timer showing 5:00 countdown
- 📝 Input field for OTP code

---

### **STEP 7: Student Enters OTP**

**What the student does:**
- Checks phone SMS or email inbox
- Sees code: `456789`
- Types `456789` into the OTP input field
- Clicks "Verify" button

**Frontend sends:**
```http
POST /api/v1/auth/student/verify-otp
Content-Type: application/json

{
  "student_id_number": "STU2024001",
  "national_id": "1234567890123",
  "otp": "456789"
}
```

---

### **STEP 8: Backend Verifies OTP**

**Verification Process:**

```typescript
// 1. Reconstruct the key
const key = "STU2024001-1234567890123";

// 2. Retrieve stored OTP from memory
const storedOtp = otpStore.get(key);

// 3. Check if OTP exists
if (!storedOtp) {
  throw new BadRequestException('OTP not found or expired');
}

// 4. Check if OTP has expired
if (new Date() > storedOtp.expiresAt) {
  otpStore.delete(key); // Clean up
  throw new BadRequestException('OTP has expired');
}

// 5. Compare entered OTP with stored OTP
if (storedOtp.otp !== "456789") {
  throw new BadRequestException('Invalid OTP');
}

// 6. OTP is valid! Delete it (single-use)
otpStore.delete(key);
```

**Verification Checks:**
| Check | Condition | Result |
|-------|-----------|--------|
| OTP exists? | `storedOtp !== undefined` | ✅ Pass |
| Not expired? | `now < expiresAt` | ✅ Pass |
| Correct code? | `"456789" === "456789"` | ✅ Pass |

---

### **STEP 9: Generate JWT Token**

**Token Creation:**
```typescript
const payload = {
  sub: "uuid-abc-123",              // Student ID
  student_id_number: "STU2024001",  // Student number
  type: "student",                  // User type
  iat: 1705334400,                  // Issued at timestamp
  exp: 1705420800                   // Expires in 24 hours
};

const jwt = jwtService.sign(payload);
```

**Generated JWT:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1dWlkLWFiYy0xMjMiLCJzdHVkZW50X2lkX251bWJlciI6IlNUVTIwMjQwMDEiLCJ0eXBlIjoic3R1ZGVudCIsImlhdCI6MTcwNTMzNDQwMCwiZXhwIjoxNzA1NDIwODAwfQ.signature_here
```

---

### **STEP 10: Backend Responds with Success**

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "student": {
    "id": "uuid-abc-123",
    "full_name": "Jane Smith",
    "student_id_number": "STU2024001",
    "email": "jane.smith@university.edu"
  }
}
```

---

### **STEP 11: Frontend Stores Token & Redirects**

**What happens:**
```javascript
// 1. Store JWT in localStorage or cookie
localStorage.setItem('access_token', response.access_token);

// 2. Store user info
localStorage.setItem('user', JSON.stringify(response.student));

// 3. Redirect to student dashboard
window.location.href = '/student/dashboard';
```

---

### **STEP 12: Student Accesses Protected Resources**

**Every subsequent request includes JWT:**
```http
GET /api/v1/certificates/student/uuid-abc-123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Backend validates JWT:**
```typescript
// JWT Guard automatically:
// 1. Extracts token from Authorization header
// 2. Verifies signature using JWT_SECRET
// 3. Checks expiration
// 4. Attaches decoded payload to request.user
```

---

## 🔒 Security Features

### 1. **No Password Storage**
- Students don't have passwords
- Identity verified by Student ID + National ID (both in database)

### 2. **OTP Expiration**
- OTP valid for exactly **5 minutes**
- Automatically deleted after expiration

### 3. **Single-Use OTP**
- Once verified, OTP is immediately deleted
- Cannot be reused

### 4. **Dual-Channel Delivery**
- SMS + Email sent simultaneously
- Student can use either channel

### 5. **In-Memory Storage**
- OTPs stored in server memory (Map)
- Not persisted to database
- Cleared on server restart

### 6. **JWT Expiration**
- Token valid for **24 hours**
- Must re-authenticate after expiration

---

## ⚠️ Error Scenarios

### Scenario 1: Wrong Student ID or National ID
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

### Scenario 2: OTP Expired (after 5 minutes)
```json
{
  "statusCode": 400,
  "message": "OTP has expired. Please request a new one."
}
```

### Scenario 3: Wrong OTP Code
```json
{
  "statusCode": 400,
  "message": "Invalid OTP"
}
```

### Scenario 4: OTP Not Found (never requested)
```json
{
  "statusCode": 400,
  "message": "OTP not found or expired. Please request a new one."
}
```

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        STUDENT LOGIN FLOW                        │
└─────────────────────────────────────────────────────────────────┘

[Student]                [Frontend]              [Backend]              [Database]        [SMS/Email]
    │                         │                       │                      │                  │
    │ 1. Enter Student ID     │                       │                      │                  │
    │    & National ID        │                       │                      │                  │
    ├────────────────────────>│                       │                      │                  │
    │                         │                       │                      │                  │
    │                         │ 2. POST /request-otp  │                      │                  │
    │                         ├──────────────────────>│                      │                  │
    │                         │                       │                      │                  │
    │                         │                       │ 3. Query student     │                  │
    │                         │                       ├─────────────────────>│                  │
    │                         │                       │                      │                  │
    │                         │                       │ 4. Student found     │                  │
    │                         │                       │<─────────────────────┤                  │
    │                         │                       │                      │                  │
    │                         │                       │ 5. Generate OTP      │                  │
    │                         │                       │    (e.g., 456789)    │                  │
    │                         │                       │                      │                  │
    │                         │                       │ 6. Store in memory   │                  │
    │                         │                       │    (5 min expiry)    │                  │
    │                         │                       │                      │                  │
    │                         │                       │ 7. Send OTP          │                  │
    │                         │                       ├─────────────────────────────────────────>│
    │                         │                       │                      │                  │
    │                         │ 8. Success response   │                      │                  │
    │                         │<──────────────────────┤                      │                  │
    │                         │                       │                      │                  │
    │ 9. Show OTP input       │                       │                      │                  │
    │<────────────────────────┤                       │                      │                  │
    │                         │                       │                      │                  │
    │ 10. Receive SMS/Email   │                       │                      │                  │
    │<─────────────────────────────────────────────────────────────────────────────────────────┤
    │     "Code: 456789"      │                       │                      │                  │
    │                         │                       │                      │                  │
    │ 11. Enter OTP code      │                       │                      │                  │
    ├────────────────────────>│                       │                      │                  │
    │                         │                       │                      │                  │
    │                         │ 12. POST /verify-otp  │                      │                  │
    │                         ├──────────────────────>│                      │                  │
    │                         │                       │                      │                  │
    │                         │                       │ 13. Verify OTP       │                  │
    │                         │                       │     - Check exists   │                  │
    │                         │                       │     - Check expiry   │                  │
    │                         │                       │     - Compare code   │                  │
    │                         │                       │                      │                  │
    │                         │                       │ 14. Delete OTP       │                  │
    │                         │                       │     (single-use)     │                  │
    │                         │                       │                      │                  │
    │                         │                       │ 15. Generate JWT     │                  │
    │                         │                       │                      │                  │
    │                         │ 16. Return JWT token  │                      │                  │
    │                         │<──────────────────────┤                      │                  │
    │                         │                       │                      │                  │
    │ 17. Store token         │                       │                      │                  │
    │     Redirect dashboard  │                       │                      │                  │
    │<────────────────────────┤                       │                      │                  │
    │                         │                       │                      │                  │
    │ 18. Access resources    │                       │                      │                  │
    │     with JWT token      │                       │                      │                  │
    └─────────────────────────┴───────────────────────┴──────────────────────┴──────────────────┘
```

---

## 🔧 Configuration Required

In your `.env` file:

```env
# SMS Provider (e.g., Twilio, Africa's Talking)
SMS_API_URL=https://api.sms.provider.com/v1/send
SMS_API_KEY=your_sms_api_key

# Email Provider (e.g., SendGrid, Mailgun)
EMAIL_API_URL=https://api.email.provider.com/v1/send
EMAIL_API_KEY=your_email_api_key

# JWT Secret
JWT_SECRET=your_super_secret_key_change_in_production
```

---

## ✅ Summary

1. **Student enters** Student ID + National ID
2. **System validates** identity against database
3. **System generates** random 6-digit OTP
4. **System stores** OTP in memory (5-minute expiration)
5. **System sends** OTP via SMS + Email simultaneously
6. **Student receives** OTP on phone and email
7. **Student enters** OTP code
8. **System verifies** OTP (exists, not expired, matches)
9. **System deletes** OTP (single-use)
10. **System generates** JWT token (24-hour expiration)
11. **Student receives** JWT token + user info
12. **Student accesses** protected resources with JWT

**No passwords. No database storage of OTPs. Secure and simple.**
