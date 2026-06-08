# Render.com Deployment Guide

## Prerequisites

1. Create a PostgreSQL database on Render
2. Get the database connection details

---

## Step 1: Create PostgreSQL Database on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Fill in:
   - **Name:** `certificate-verification-db`
   - **Database:** `certificate_verification`
   - **User:** (auto-generated)
   - **Region:** (choose closest to you)
   - **Plan:** Free or Starter
4. Click **"Create Database"**
5. **Copy the connection details:**
   - Internal Database URL
   - External Database URL
   - Host
   - Port
   - Database
   - Username
   - Password

---

## Step 2: Create Web Service on Render

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select `certificate_verification` folder (or configure root directory)
4. Fill in:
   - **Name:** `certificate-verification-api`
   - **Environment:** `Node`
   - **Region:** (same as database)
   - **Branch:** `main` (or your branch name)
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`
   - **Plan:** Free or Starter

---

## Step 3: Set Environment Variables

In your Render web service dashboard, go to **"Environment"** tab and add these variables:

### Required Variables:

```env
# Database (use Internal Database URL from your Render PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/certificate_verification

# OR set individual values:
DB_HOST=dpg-xxxxx-a.oregon-postgres.render.com
DB_PORT=5432
DB_USERNAME=certificate_verification_user
DB_PASSWORD=xxxxxxxxxxxxx
DB_NAME=certificate_verification

# Node Environment
NODE_ENV=production

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Blockchain
OPTIMISM_SEPOLIA_RPC_URL=https://sepolia.optimism.io
CREDENTIAL_REGISTRY_ADDRESS=0xC244d92B2bdEE4f755734C601C156D9B67774ec3
OPERATOR_PRIVATE_KEY=0xyour_operator_private_key_here
MASTER_AES_KEY=3196005aef5597ac07ab3f705721f6c7ae0a34f018a76f3bc7f86ab8f0a4b2df

# Email (Brevo)
BREVO_API_KEY=your_brevo_api_key_here
EMAIL_FROM=noreply@yourdomain.com

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend-url.onrender.com

# Port (Render sets this automatically, but you can specify)
PORT=3000
```

---

## Step 4: Update app.module.ts for Production

Your app needs to read `DATABASE_URL` or individual DB environment variables. Update your TypeORM configuration:

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  url: process.env.DATABASE_URL,  // Render provides this
  // OR use individual values:
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'certificate_verification',
  
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development', // FALSE in production!
  logging: false,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
}),
```

---

## Step 5: Database Schema Setup

Since `synchronize: false` in production, you need to set up the schema manually:

1. Connect to your Render PostgreSQL database using the **External Database URL**
2. Run your schema SQL:

```sql
-- Run the SQL from your schema file
-- You can use pgAdmin, DBeaver, or psql command line
```

Or use a migration tool like TypeORM migrations.

---

## Step 6: Deploy

1. **Commit and push your changes:**
   ```bash
   git add .
   git commit -m "Configure for Render deployment"
   git push
   ```

2. **Render will automatically deploy** when you push to the connected branch

3. **Check the logs** in Render dashboard for any errors

---

## Troubleshooting

### Error: ECONNREFUSED
**Cause:** Can't connect to database  
**Fix:** Check environment variables are set correctly in Render dashboard

### Error: relation "table_name" does not exist
**Cause:** Database schema not set up  
**Fix:** Run your SQL schema on the Render PostgreSQL database

### Error: npm install fails
**Cause:** Peer dependency conflicts  
**Fix:** Make sure `.npmrc` file with `legacy-peer-deps=true` is committed

### Error: Application timeout
**Cause:** App taking too long to start  
**Fix:** Check logs for specific errors. Make sure DB connection works.

---

## Post-Deployment Checklist

- [ ] Web service is running (green status in Render dashboard)
- [ ] Check logs for successful database connection
- [ ] Test API endpoint: `https://your-service.onrender.com`
- [ ] Update frontend `.env` with new backend URL
- [ ] Test certificate verification
- [ ] Test blockchain features

---

## Useful Commands

### View logs:
In Render dashboard → Logs tab (real-time)

### Connect to database:
```bash
psql postgresql://user:password@host:5432/certificate_verification
```

### Restart service:
In Render dashboard → Manual Deploy → "Clear build cache & deploy"

---

## Important Notes

1. **SSL is required** for Render PostgreSQL connections
2. **Synchronize should be FALSE** in production
3. **Use DATABASE_URL** environment variable (Render provides this automatically)
4. **Free tier sleeps after 15 minutes** of inactivity (first request will be slow)
5. **Build takes 5-10 minutes** on free tier

---

## Next Steps

After backend is deployed:
1. Deploy frontend to Vercel/Netlify/Render
2. Update frontend `NEXT_PUBLIC_API_URL` to point to Render backend URL
3. Test end-to-end flow
