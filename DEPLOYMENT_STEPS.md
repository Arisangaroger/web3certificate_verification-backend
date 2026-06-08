# 🚀 Render.com Deployment - Step by Step

## Current Status
✅ Database connection config updated for Render  
✅ NPM config fixed (.npmrc with legacy-peer-deps)  
⚠️ Hash regeneration script ready (needs to run after deployment)

---

## Pre-Deployment Checklist

### 1. Database Column Fix (Already Done by User)
```sql
-- This was already executed manually:
ALTER TABLE certificates ALTER COLUMN data_hash TYPE VARCHAR(66);
```

### 2. Regenerate All Certificate Hashes (Run Locally First)
```bash
npx ts-node src/scripts/regenerate-hashes.ts
```

This will:
- Recalculate all `data_hash` values using keccak256
- Update certificates with correct 66-character hashes
- Fix the "Database record hash does not match" error

---

## Render.com Deployment Steps

### Step 1: Create PostgreSQL Database

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Settings:
   - **Name:** `certificate-verification-db`
   - **Database:** `certificate_verification`
   - **Region:** Choose closest to you
   - **Plan:** Free (or Starter for better performance)
4. Click **"Create Database"**
5. **IMPORTANT:** Copy these values from the database dashboard:
   - **Internal Database URL** (use this one for your app)
   - External Database URL (for pgAdmin/DBeaver access)
   - Host, Port, Database, Username, Password

---

### Step 2: Import Database Schema

You need to set up the database schema on Render. Two options:

#### Option A: Using External Database URL with pgAdmin/DBeaver
1. Open pgAdmin or DBeaver
2. Connect using the **External Database URL**
3. Run all your schema SQL files

#### Option B: Using Render's Shell
1. Go to your database in Render dashboard
2. Click **"Shell"** tab
3. Run your SQL commands directly

**Required Tables:**
- admin_users
- students
- universities  
- certificates
- (any other tables in your schema)

---

### Step 3: Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Settings:
   - **Name:** `certificate-verification-api`
   - **Root Directory:** `certificate_verification` (if monorepo) or leave blank
   - **Environment:** `Node`
   - **Region:** Same as database
   - **Branch:** `main`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`
   - **Plan:** Free (or Starter)

---

### Step 4: Set Environment Variables

In your Render web service → **"Environment"** tab, add these:

```env
# Database - Use Internal Database URL from your Render PostgreSQL
DATABASE_URL=postgresql://user:password@host/certificate_verification

# Node Environment
NODE_ENV=production

# JWT Secret (CHANGE THIS!)
JWT_SECRET=your-super-secret-production-jwt-key-min-32-chars

# Port (Render sets automatically, but good to specify)
PORT=3000

# Blockchain - Optimism Sepolia
OPTIMISM_SEPOLIA_RPC_URL=https://sepolia.optimism.io
CREDENTIAL_REGISTRY_ADDRESS=0xC244d92B2bdEE4f755734C601C156D9B67774ec3
OPERATOR_PRIVATE_KEY=49d7b14232ee0c557585425595425edd916f0db3abb06a00629e9fdd10561850
MASTER_AES_KEY=3196005aef5597ac07ab3f705721f6c7ae0a34f018a76f3bc7f86ab8f0a4b2df

# Email - Brevo SMTP
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=ad4e5d001@smtp-brevo.com
SMTP_PASS=xsmtpsib-164b1bc5d4dfa532491aede8eeca57ee40f0f362f6c87b9f1420953e0c52fadd-TwQLy6H0D2eyshY7
MAIL_FROM=arisangaroger26@gmail.com

# Frontend URL (update after frontend deployment)
FRONTEND_URL=https://your-frontend-url.onrender.com

# Puppeteer - for PDF generation
PUPPETEER_SKIP_DOWNLOAD=false
```

**IMPORTANT:** 
- Copy `DATABASE_URL` from your Render PostgreSQL dashboard (Internal URL)
- Change `JWT_SECRET` to a strong random string
- Update `FRONTEND_URL` after deploying frontend

---

### Step 5: Commit and Deploy

```bash
git add .
git commit -m "Configure for Render deployment"
git push origin main
```

Render will automatically detect the push and start building.

---

### Step 6: Monitor Deployment

1. Go to Render dashboard → Your web service
2. Click **"Logs"** tab
3. Watch for:
   - ✅ Build success
   - ✅ "Nest application successfully started"
   - ✅ Database connection established
   - ❌ Any errors

---

### Step 7: Post-Deployment Tasks

#### A. Run Hash Regeneration on Production
After successful deployment, connect to production database and run:
```bash
npx ts-node src/scripts/regenerate-hashes.ts
```

Or add this as a one-time job in Render.

#### B. Test the API
```bash
# Check health
curl https://your-service.onrender.com

# Test verification endpoint
curl https://your-service.onrender.com/api/verification/CERT_ID
```

#### C. Update Frontend
Update frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://your-service.onrender.com
```

---

## Troubleshooting

### Error: `npm install` fails with peer dependency conflicts
**Solution:** ✅ Already fixed with `.npmrc` file containing `legacy-peer-deps=true`

### Error: `ECONNREFUSED ::1:5432` or `127.0.0.1:5432`
**Cause:** App trying to connect to localhost instead of Render database  
**Solution:** 
1. Verify `DATABASE_URL` environment variable is set in Render
2. Make sure it's the **Internal Database URL** (not External)
3. Check app.module.ts reads `DATABASE_URL` correctly (✅ already fixed)

### Error: `relation "certificates" does not exist`
**Cause:** Database schema not imported  
**Solution:** Import your SQL schema into Render PostgreSQL (Step 2)

### Error: `value too long for type character varying(64)`
**Cause:** Hash column still 64 characters instead of 66  
**Solution:** Run this on Render database:
```sql
ALTER TABLE certificates ALTER COLUMN data_hash TYPE VARCHAR(66);
```

### Error: SSL connection required
**Cause:** Production databases require SSL  
**Solution:** ✅ Already fixed in app.module.ts with SSL config

### Error: Build timeout
**Cause:** npm install taking too long on free tier  
**Solution:** Use `npm ci` instead of `npm install` in build command

---

## Free Tier Limitations

- **Service sleeps after 15 min inactivity** → First request takes 30-60s to wake up
- **750 hours/month** → Enough for one service running 24/7
- **Build time:** 5-10 minutes
- **Database:** 1GB storage

Consider upgrading to Starter ($7/month) for:
- No sleep
- Faster builds
- More resources

---

## What's Next?

1. ✅ Backend deployed and running
2. 🔄 Deploy frontend to Vercel/Netlify/Render
3. 🔄 Update CORS settings if needed
4. 🔄 Test end-to-end certificate flow
5. 🔄 Set up custom domain (optional)

---

## Useful Render Commands

### View logs (real-time):
Dashboard → Logs tab

### Restart service:
Dashboard → Manual Deploy → "Clear build cache & deploy"

### Access database shell:
Dashboard → Your database → Shell tab

### Connect with psql:
```bash
psql <External Database URL>
```

---

## Need Help?

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Check deployment logs in Render dashboard
