# Project Structure - Certificate Verification Backend

## Complete Directory Tree

```
certificate_verification/
├── src/
│   ├── common/                           # Shared utilities across modules
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts       # @Public() - Skip JWT auth
│   │   │   └── roles.decorator.ts        # @Roles() - RBAC decorator
│   │   ├── entities/
│   │   │   └── base.entity.ts            # Base entity with UUID & timestamps
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts  # Global exception handler
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts         # JWT authentication guard
│   │   │   └── roles.guard.ts            # Role-based authorization guard
│   │   └── interceptors/
│   │       └── logging.interceptor.ts    # Request/response logger
│   │
│   ├── config/
│   │   └── database.config.ts            # TypeORM configuration
│   │
│   ├── modules/
│   │   ├── admin-users/                  # University Admin Management
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   │   └── admin-user.entity.ts  # Maps to: institution_admins table
│   │   │   ├── admin-users.controller.ts
│   │   │   ├── admin-users.service.ts
│   │   │   └── admin-users.module.ts
│   │   │
│   │   ├── auth/                         # Authentication & Authorization
│   │   │   ├── dto/
│   │   │   │   ├── login-admin.dto.ts
│   │   │   │   ├── login-student.dto.ts
│   │   │   │   └── verify-mfa.dto.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts       # Passport JWT strategy
│   │   │   ├── auth.controller.ts        # Login endpoints
│   │   │   ├── auth.service.ts           # Auth logic (JWT, bcrypt)
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── blockchain/                   # Optimism L2 Integration
│   │   │   ├── blockchain.service.ts     # Ethers.js + Keccak-256 hashing
│   │   │   └── blockchain.module.ts
│   │   │
│   │   ├── certificates/                 # Certificate Management
│   │   │   ├── entities/
│   │   │   │   └── certificate.entity.ts # Maps to: certificates table
│   │   │   ├── certificates.controller.ts
│   │   │   ├── certificates.service.ts
│   │   │   └── certificates.module.ts
│   │   │
│   │   ├── file-upload/                  # CSV Batch Processing
│   │   │   ├── dto/
│   │   │   │   └── upload-batch.dto.ts
│   │   │   ├── file-upload.controller.ts # POST /batch endpoint
│   │   │   ├── file-upload.service.ts    # Stream-based CSV parser
│   │   │   └── file-upload.module.ts
│   │   │
│   │   ├── notification/                 # SMS/Email OTP Delivery
│   │   │   ├── notification.service.ts   # SMS & Email API integration
│   │   │   └── notification.module.ts
│   │   │
│   │   ├── payment/                      # Mobile Money Integration
│   │   │   ├── entities/
│   │   │   │   └── payment.entity.ts     # Maps to: payments table
│   │   │   ├── payment.controller.ts     # Initiate & callback endpoints
│   │   │   ├── payment.service.ts        # MoMo API integration
│   │   │   └── payment.module.ts
│   │   │
│   │   ├── pdf-generator/                # Certificate PDF Generation
│   │   │   ├── pdf-generator.service.ts  # Puppeteer HTML-to-PDF
│   │   │   └── pdf-generator.module.ts
│   │   │
│   │   ├── qr-code/                      # QR Code Generation
│   │   │   ├── qr-code.service.ts        # QR code library wrapper
│   │   │   └── qr-code.module.ts
│   │   │
│   │   ├── students/                     # Student Management
│   │   │   ├── entities/
│   │   │   │   └── student.entity.ts     # Maps to: student table
│   │   │   ├── students.controller.ts
│   │   │   ├── students.service.ts
│   │   │   └── students.module.ts
│   │   │
│   │   ├── universities/                 # University Registry
│   │   │   ├── entities/
│   │   │   │   └── university.entity.ts  # Maps to: universities table
│   │   │   ├── universities.controller.ts
│   │   │   ├── universities.service.ts
│   │   │   └── universities.module.ts
│   │   │
│   │   └── verification/                 # Public Verification Endpoint
│   │       ├── verification.controller.ts # GET /:certificate_id
│   │       ├── verification.service.ts    # Three-way hash verification
│   │       └── verification.module.ts
│   │
│   ├── app.module.ts                     # Root application module
│   └── main.ts                           # Application bootstrap
│
├── test/                                 # E2E tests
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── .env                                  # Environment variables (DO NOT COMMIT)
├── .env.example                          # Environment template
├── .gitignore
├── .prettierrc
├── CSV_TEMPLATE.md                       # CSV upload format guide
├── eslint.config.mjs
├── nest-cli.json
├── package.json
├── package-lock.json
├── PROJECT_STRUCTURE.md                  # This file
├── README.md                             # Project documentation
├── tsconfig.json
└── tsconfig.build.json
```

## Database Schema Mapping

### Tables → Entities

| Database Table | Entity File | Primary Key | Notes |
|----------------|-------------|-------------|-------|
| `universities` | `university.entity.ts` | `id` (UUID) | University registry |
| `institution_admins` | `admin-user.entity.ts` | `id` (UUID) | Admin users with ENUM role |
| `student` | `student.entity.ts` | `id` (UUID) | Unique constraint on (university_id, student_id_number) |
| `certificates` | `certificate.entity.ts` | `id` (VARCHAR 12) | 12-char NanoID-style primary key |
| `payments` | `payment.entity.ts` | `id` (UUID) | MoMo payment tracking |

### Key Relationships

```
Universities (1) ──< (N) Institution_admins
Universities (1) ──< (N) Student
Universities (1) ──< (N) Certificates
Student (1) ──< (N) Certificates
```

## Module Dependencies

```
app.module
├── ConfigModule (Global)
├── TypeOrmModule (Global)
├── AuthModule
│   ├── JwtModule
│   ├── PassportModule
│   ├── AdminUsersModule
│   ├── StudentsModule
│   └── NotificationModule
├── UniversitiesModule
├── StudentsModule
├── CertificatesModule
│   ├── BlockchainModule
│   └── PdfGeneratorModule
│       └── QrCodeModule
├── AdminUsersModule
├── PaymentModule
├── BlockchainModule
├── PdfGeneratorModule
├── QrCodeModule
├── VerificationModule
│   ├── CertificatesModule
│   └── BlockchainModule
├── FileUploadModule
│   ├── StudentsModule
│   ├── CertificatesModule
│   ├── PaymentModule
│   └── BlockchainModule
└── NotificationModule
```

## API Endpoints Summary

### Public Endpoints (No Auth Required)
- `GET /api/v1/universities` - List all universities
- `GET /api/v1/universities/:id` - Get university details
- `GET /api/v1/verification/:certificate_id` - Verify certificate (QR scan)
- `POST /api/v1/auth/admin/login` - Admin login
- `POST /api/v1/auth/student/login` - Student login
- `POST /api/v1/payment/callback` - MoMo webhook

### Protected Endpoints (JWT Required)

#### Admin Only (Role: REGISTRAR)
- `POST /api/v1/file-upload/batch` - Upload CSV batch

#### Student Access
- `GET /api/v1/certificates/student/:studentId` - Get student's certificates

#### Payment
- `POST /api/v1/payment/initiate` - Initiate MoMo payment

## Key Features by Module

### 1. Authentication (`auth`)
- **Admin**: Email + Password → JWT
- **Student**: student_id_number + national_id → JWT
- Role-based access control (REGISTRAR, VIEWER)

### 2. File Upload (`file-upload`)
- Stream-based CSV parsing (memory efficient)
- Transactional batch processing
- Automatic rollback on failure

### 3. Blockchain (`blockchain`)
- Keccak-256 hash generation
- Optimism L2 smart contract integration
- Gas-efficient batch anchoring

### 4. Verification (`verification`)
- Three-way verification:
  1. Runtime hash from DB data
  2. Stored hash in DB
  3. Blockchain hash lookup
- Public access (no auth)

### 5. PDF Generator (`pdf-generator`)
- Puppeteer-based rendering
- Embedded QR codes
- University-branded templates

### 6. Payment (`payment`)
- Mobile Money STK Push
- Webhook callback handling
- Payment verification

## Environment Variables Required

See `.env.example` for complete list:
- Database credentials (PostgreSQL)
- JWT secret
- Blockchain RPC URL & wallet
- MoMo API credentials
- SMS/Email API credentials

## Next Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with actual credentials
   ```

3. **Run Development Server**
   ```bash
   npm run start:dev
   ```

4. **Test Endpoints**
   - Use Postman/Insomnia
   - See README.md for API documentation

## Security Features

- JWT authentication with 24h expiration
- Bcrypt password hashing
- Role-based access control (RBAC)
- Input validation (class-validator)
- SQL injection protection (TypeORM)
- CORS configuration
- Exception filtering
