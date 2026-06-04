# Decentralized Academic Credential Verification Platform - Backend

Enterprise-grade NestJS backend for blockchain-anchored academic credential verification.

## Architecture Overview

```
src/
├── common/                    # Shared utilities
│   ├── decorators/           # Custom decorators (@Public, @Roles)
│   ├── entities/             # Base entity with timestamps
│   ├── filters/              # Exception filters
│   ├── guards/               # Auth & role guards
│   └── interceptors/         # Logging interceptor
├── config/                   # Configuration files
│   └── database.config.ts    # TypeORM configuration
├── modules/                  # Feature modules
│   ├── admin-users/          # University admin management
│   ├── auth/                 # Authentication (JWT, MFA, OTP)
│   ├── blockchain/           # Optimism L2 integration
│   ├── certificates/         # Certificate CRUD & verification
│   ├── file-upload/          # CSV batch processing
│   ├── notification/         # SMS/Email OTP delivery
│   ├── payment/              # Mobile Money integration
│   ├── pdf-generator/        # Certificate PDF generation
│   ├── qr-code/              # QR code generation
│   ├── students/             # Student management
│   ├── universities/         # University registry
│   └── verification/         # Public verification endpoint
├── app.module.ts             # Root module
└── main.ts                   # Application bootstrap
```

## Core Features

### 1. Three-Way Authentication
- **Admin**: Email + Password + TOTP MFA
- **Student**: Registration Number + National ID + SMS/Email OTP
- **Public Verifier**: No authentication (QR/URL access)

### 2. Cryptographic Verification
- Keccak-256 hash generation from certificate data
- Three-way match: Runtime Hash ↔ Database Hash ↔ Blockchain Hash
- Instant tamper detection

### 3. Batch Processing
- Memory-efficient CSV streaming (handles 10,000+ records)
- Transactional rollback on payment/upload failure
- Automatic blockchain anchoring post-payment

### 4. PDF Generation
- Puppeteer-based HTML-to-PDF rendering
- Embedded QR codes for instant verification
- University-branded templates

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your .env file with actual credentials
```

## Database Setup

Ensure PostgreSQL is running and configured in `.env`:

```bash
# The database should already be set up with tables:
# - universities
# - admin_users
# - students
# - certificates
# - payments
```

## Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/admin/login` - Admin login
- `POST /api/v1/auth/student/login` - Student login

### Universities
- `GET /api/v1/universities` - List all universities
- `GET /api/v1/universities/:id` - Get university details

### File Upload (Admin Only)
- `POST /api/v1/file-upload/batch` - Upload CSV batch

### Certificates
- `GET /api/v1/certificates/student/:studentId` - Get student certificates

### Verification (Public)
- `GET /api/v1/verification/:certificate_id` - Verify certificate

### Payment
- `POST /api/v1/payment/initiate` - Initiate MoMo payment
- `POST /api/v1/payment/callback` - Payment callback (webhook)

## Environment Variables

See `.env.example` for all required configuration.

## Security Features

- JWT-based authentication with 24h expiration
- TOTP MFA for admin users
- SMS/Email OTP for students
- Role-based access control (RBAC)
- Input validation with class-validator
- SQL injection protection via TypeORM
- CORS configuration

## Blockchain Integration

The system uses Optimism (Layer 2) for:
- Gas-efficient transaction costs
- Immutable certificate registry
- Public verification without authentication

## Tech Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL + TypeORM
- **Authentication**: Passport JWT + Speakeasy (TOTP)
- **Blockchain**: Ethers.js + Optimism L2
- **PDF Generation**: Puppeteer
- **File Processing**: csv-parser (streaming)
- **Payment**: Mobile Money API integration

## Development

```bash
# Run tests
npm run test

# Run e2e tests
npm run test:e2e

# Lint
npm run lint

# Format
npm run format
```

## License

UNLICENSED - Private Enterprise Software
