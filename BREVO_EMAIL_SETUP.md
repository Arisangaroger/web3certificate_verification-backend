# Brevo Email Configuration Guide

## ✅ What Was Configured

Your application now uses **Brevo (formerly Sendinblue) SMTP** to send emails via **Nodemailer**.

---

## 📋 Configuration Summary

### **1. Removed:**
- ❌ Axios-based email API calls
- ❌ `EMAIL_API_URL` and `EMAIL_API_KEY` environment variables

### **2. Added:**
- ✅ Nodemailer with Brevo SMTP configuration
- ✅ SMTP environment variables (host, port, user, password)
- ✅ HTML-formatted OTP emails
- ✅ Secure SMTP connection (TLS on port 587)

---

## 📝 Files Modified

### **1. `notification.service.ts`**
**Location:** `src/modules/notification/notification.service.ts`

**Changes:**
- Replaced Axios HTTP calls with Nodemailer SMTP
- Added transporter configuration using Brevo credentials
- Upgraded OTP email to HTML format with styling
- Email now sent via SMTP instead of REST API

**Before:**
```typescript
await axios.post(EMAIL_API_URL, {to, subject, body}, {headers});
```

**After:**
```typescript
await this.transporter.sendMail({
  from: process.env.MAIL_FROM,
  to: email,
  subject,
  html: htmlBody
});
```

---

### **2. `.env.example`**
**Location:** `certificate_verification/.env.example`

**Changes:**
- Removed: `EMAIL_API_URL`, `EMAIL_API_KEY`
- Added: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`

**New variables:**
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_smtp_user
SMTP_PASS=your_brevo_smtp_password
MAIL_FROM=your_email@example.com
```

---

## 🔧 Your Environment Variables

Add these to your `.env` file (you already have them):

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=ad4e5d001@smtp-brevo.com
SMTP_PASS=xsmtpsib-164b1bc5d4dfa532491aede8eeca57ee40f0f362f6c87b9f1420953e0c52fadd-TwQLy6H0D2eyshY7
MAIL_FROM=arisangaroger26@gmail.com
```

---

## 📧 How It Works Now

### **OTP Email Flow:**

1. **Student requests OTP**
   - System generates 6-digit code (e.g., `456789`)

2. **Nodemailer connects to Brevo SMTP**
   - Host: `smtp-relay.brevo.com`
   - Port: `587` (TLS)
   - Auth: Your SMTP credentials

3. **Email sent with HTML formatting**
   ```html
   <h2>Verification Code</h2>
   <p>Your verification code is:</p>
   <h1 style="color: #0066cc;">456789</h1>
   <p>Valid for 5 minutes.</p>
   ```

4. **Student receives professional email**
   - Clean HTML layout
   - Large, clear OTP code
   - Expiration warning

---

## 🎨 Email Template Features

The OTP email now includes:
- ✅ HTML formatting for better readability
- ✅ Large, colored OTP code (easy to read)
- ✅ Clear expiration notice (5 minutes)
- ✅ Security warning (ignore if not requested)
- ✅ Professional styling with Arial font

---

## 🧪 Testing Email Sending

### Test 1: Send a Test Email

Create a test endpoint or run this in your code:

```typescript
await this.notificationService.sendEmail(
  'test@example.com',
  'Test Email',
  '<h1>Hello!</h1><p>This is a test email from your app.</p>'
);
```

### Test 2: Test OTP Flow

Request OTP for a student:

```bash
curl -X POST http://localhost:3000/api/v1/auth/student/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "student_id_number": "ST001",
    "national_id": "1234567890"
  }'
```

Check the student's email inbox for the OTP code.

---

## 🔒 Security Notes

### **1. SMTP Credentials**
- ✅ Your SMTP password is an API key (secure)
- ✅ Stored in `.env` file (not committed to git)
- ✅ Connection uses TLS encryption (port 587)

### **2. Rate Limits**
Brevo free tier limits:
- **300 emails per day**
- If you need more, upgrade your Brevo plan

### **3. Sender Email**
- Your `MAIL_FROM` is `arisangaroger26@gmail.com`
- Make sure this email is verified in Brevo dashboard
- Otherwise, emails may go to spam

---

## ⚠️ Troubleshooting

### Issue 1: "Authentication failed"
**Solution:** Double-check `SMTP_USER` and `SMTP_PASS` in `.env`

### Issue 2: "Connection timeout"
**Solution:** 
- Check firewall allows port 587
- Verify `SMTP_HOST` is correct: `smtp-relay.brevo.com`

### Issue 3: Emails going to spam
**Solution:**
- Verify sender email in Brevo dashboard
- Add SPF/DKIM records to your domain (if using custom domain)

### Issue 4: "Sender not verified"
**Solution:** Log into Brevo dashboard and verify `arisangaroger26@gmail.com`

---

## 📊 Brevo Dashboard

Monitor your emails at: https://app.brevo.com

You can see:
- ✅ Emails sent today
- ✅ Delivery status
- ✅ Bounce rate
- ✅ Remaining daily quota

---

## ✅ Summary

**What changed:**
1. ✅ Removed Axios REST API email sending
2. ✅ Added Nodemailer with SMTP
3. ✅ Configured Brevo SMTP credentials
4. ✅ Upgraded to HTML-formatted emails
5. ✅ Professional OTP email template

**Files modified:**
- `src/modules/notification/notification.service.ts` (main changes)
- `.env.example` (updated variables)

**Your app now:**
- ✅ Sends emails via Brevo SMTP
- ✅ Uses your credentials
- ✅ Sends professional HTML emails
- ✅ Works with OTP authentication flow

**No other changes needed** - your authentication flow remains the same!
