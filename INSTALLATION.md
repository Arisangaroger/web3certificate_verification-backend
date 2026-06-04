# Installation Guide

## ✅ Installation Complete!

Your dependencies have been successfully installed.

---

## 🔧 What Was Fixed

### 1. **Version Conflicts Resolved**
- Updated `@nestjs/jwt` from v10 to v11 (compatible with NestJS 11)
- Updated `@nestjs/passport` from v10 to v11
- Removed `speakeasy` (not needed - using custom OTP generation)

### 2. **Puppeteer Configuration**
- Skipped automatic Chrome download
- Will use your system's installed Chrome browser
- Set `PUPPETEER_SKIP_DOWNLOAD=true` in environment

---

## 📝 Next Steps

### Step 1: Configure Environment Variables

Copy the example file:
```bash
cp .env.example .env
```

Then edit `.env` and update these critical values:

```env
# Database (REQUIRED)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_NAME=certificate_verification

# JWT Secret (REQUIRED - Change this!)
JWT_SECRET=generate_a_long_random_secret_key_here

# Puppeteer (Update Chrome path if different)
PUPPETEER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

### Step 2: Verify Database Connection

Make sure PostgreSQL is running and your database exists:

```sql
-- Connect to PostgreSQL and verify
\c certificate_verification
\dt
```

You should see your tables:
- universities
- institution_admins
- student
- certificates
- payments

### Step 3: Start Development Server

```bash
npm run start:dev
```

Expected output:
```
[Nest] 12345  - 01/15/2024, 3:00:00 PM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 01/15/2024, 3:00:00 PM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 01/15/2024, 3:00:00 PM     LOG [RoutesResolver] AuthController {/api/v1/auth}
[Nest] 12345  - 01/15/2024, 3:00:00 PM     LOG [NestApplication] Nest application successfully started
Application running on: http://localhost:3000
```

---

## 🧪 Test the API

### Test 1: Health Check
```bash
curl http://localhost:3000/api/v1/universities
```

### Test 2: Admin Login (if you have an admin in DB)
```bash
curl -X POST http://localhost:3000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@university.edu",
    "password": "your_password"
  }'
```

### Test 3: Student OTP Request (if you have a student in DB)
```bash
curl -X POST http://localhost:3000/api/v1/auth/student/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "student_id_number": "STU2024001",
    "national_id": "1234567890123"
  }'
```

---

## ⚠️ Important Notes

### 1. **Chrome/Chromium Required for PDF Generation**
Puppeteer needs Chrome to generate PDFs. Make sure Chrome is installed at:
- Windows: `C:\Program Files\Google\Chrome\Application\chrome.exe`
- Mac: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- Linux: `/usr/bin/google-chrome`

If Chrome is in a different location, update `PUPPETEER_EXECUTABLE_PATH` in `.env`

### 2. **SMS/Email APIs**
The OTP system requires SMS and Email API credentials. Update these in `.env`:
- `SMS_API_URL` and `SMS_API_KEY`
- `EMAIL_API_URL` and `EMAIL_API_KEY`

Popular providers:
- SMS: Twilio, Africa's Talking, Vonage
- Email: SendGrid, Mailgun, AWS SES

### 3. **Blockchain Configuration**
For blockchain features, you need:
- Optimism RPC URL (e.g., Alchemy, Infura)
- Wallet private key (for signing transactions)
- Deployed smart contract address

### 4. **Security Warnings**
Some packages show deprecation warnings. These are non-critical but should be addressed in production:
- `multer@1.4.x` → Upgrade to v2.x when stable
- `puppeteer@23.x` → Upgrade to v24.15.0+
- Old `glob` versions → Will be updated with dependency updates

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to database"
**Solution:** Check PostgreSQL is running and credentials in `.env` are correct

### Issue: "Puppeteer failed to launch Chrome"
**Solution:** Update `PUPPETEER_EXECUTABLE_PATH` in `.env` to your Chrome location

### Issue: "JWT secret not defined"
**Solution:** Set `JWT_SECRET` in `.env` file

### Issue: "Port 3000 already in use"
**Solution:** Change `PORT=3001` in `.env` or kill the process using port 3000

---

## 📚 Documentation Files

- `README.md` - Project overview and setup
- `PROJECT_STRUCTURE.md` - Complete file structure
- `AUTHENTICATION_GUIDE.md` - Auth endpoints and flows
- `STUDENT_LOGIN_FLOW.md` - Detailed OTP process
- `CSV_TEMPLATE.md` - Batch upload format
- `INSTALLATION.md` - This file

---

## ✅ Installation Checklist

- [x] Dependencies installed (`npm install`)
- [ ] `.env` file created and configured
- [ ] Database connection verified
- [ ] Chrome/Chromium installed
- [ ] SMS/Email API credentials added
- [ ] JWT secret generated
- [ ] Development server started
- [ ] API endpoints tested

---

## 🚀 Ready to Code!

Your backend is now set up and ready for development. Start the server with:

```bash
npm run start:dev
```

Happy coding! 🎉
