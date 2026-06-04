# CORS Configuration Guide

## What is CORS?

CORS (Cross-Origin Resource Sharing) is a security feature that controls which origins (domains/ports) can access your API.

## Problem

When frontend and backend run on different ports, browsers block requests for security:
- **Backend**: `http://localhost:3000`
- **Frontend**: `http://localhost:3001` ← Different port!
- **Result**: CORS error ❌

## Solution

### ✅ Fixed in `src/main.ts`

The backend now allows multiple frontend origins:

```typescript
app.enableCors({
  origin: [
    'http://localhost:3000',  // Frontend on port 3000
    'http://localhost:3001',  // Frontend on port 3001
    'http://localhost:3002',  // Additional port if needed
    process.env.FRONTEND_URL, // Production frontend URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
});
```

### ✅ Updated `.env`

```env
FRONTEND_URL=http://localhost:3001
```

## 🔧 How to Apply Fix

### Step 1: Stop Backend
```bash
# Press Ctrl+C in the terminal running the backend
```

### Step 2: Restart Backend
```bash
cd certificate_verification
npm run start:dev
```

### Step 3: Verify CORS Headers
You should see in the console:
```
Application running on: http://localhost:3000
```

### Step 4: Test Frontend
```bash
# In frontend terminal
cd certificate-verification-frontend
npm run dev
```

Then try logging in again!

## 🧪 Testing

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try logging in
4. Check the request to `/api/auth/admin/login`
5. Look for these headers in the **Response**:
   ```
   Access-Control-Allow-Origin: http://localhost:3001
   Access-Control-Allow-Credentials: true
   ```

## 🔍 Troubleshooting

### Error: "Response to preflight request doesn't pass"

**Cause**: Backend CORS not configured correctly

**Solution**:
1. Make sure `src/main.ts` has the updated CORS config
2. Restart the backend server
3. Clear browser cache (Ctrl+Shift+Delete)
4. Try again

### Error: "The value is not equal to the supplied origin"

**Cause**: `.env` file has wrong `FRONTEND_URL`

**Solution**:
1. Check your frontend port (usually 3000 or 3001)
2. Update `FRONTEND_URL` in `.env` to match
3. Restart backend
4. Try again

### Frontend running on different port?

**Find your frontend port**:
```bash
# Look for this in frontend terminal:
Local:   http://localhost:3001  ← This is your port
```

**Update backend `.env`**:
```env
FRONTEND_URL=http://localhost:3001  ← Match this port
```

## 🌐 Production Configuration

### Option 1: Same Domain (Recommended)
Deploy frontend and backend to same domain:
- Frontend: `https://yourdomain.com`
- Backend: `https://yourdomain.com/api`
- **No CORS needed!** ✅

### Option 2: Different Domains
If using different domains:

**.env (production)**:
```env
FRONTEND_URL=https://your-frontend.com
```

**src/main.ts** will automatically use this.

### Option 3: Multiple Environments

```typescript
// src/main.ts
const allowedOrigins = [
  'http://localhost:3000',          // Local dev
  'http://localhost:3001',          // Local dev alt
  'https://staging.yourdomain.com', // Staging
  'https://yourdomain.com',         // Production
  process.env.FRONTEND_URL,         // Dynamic
].filter(Boolean);

app.enableCors({
  origin: allowedOrigins,
  credentials: true,
});
```

## 📋 Checklist

- [x] Updated `src/main.ts` with multiple origins
- [x] Updated `.env` with correct `FRONTEND_URL`
- [x] Restarted backend server
- [ ] Cleared browser cache
- [ ] Tested login from frontend
- [ ] Verified CORS headers in Network tab

## 🚨 Common Mistakes

### ❌ Wrong Port in .env
```env
FRONTEND_URL=http://localhost:3000  # But frontend runs on 3001!
```

### ❌ Forgot to Restart Backend
Changes to `main.ts` or `.env` require restart!

### ❌ Typo in URL
```env
FRONTEND_URL=http://localhost:3001/  # Extra slash!
FRONTEND_URL=http://locahost:3001    # Typo in localhost!
```

### ❌ Browser Cache
Old CORS headers might be cached. Clear cache or use incognito mode.

## 💡 Quick Test

Run this in browser console on frontend:
```javascript
fetch('http://localhost:3000/api/auth/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@test.com', password: 'test' })
})
.then(r => console.log('CORS OK:', r.status))
.catch(e => console.error('CORS Error:', e));
```

If you see "CORS OK", it's working! ✅

## 📞 Still Having Issues?

1. Check backend is running: `http://localhost:3000/api`
2. Check frontend port: Look at terminal
3. Compare ports in browser URL vs `.env`
4. Restart both servers
5. Try incognito/private browsing mode
6. Check for typos in `.env`

---

**Status**: ✅ CORS Configuration Complete

Last Updated: 2026-06-04
