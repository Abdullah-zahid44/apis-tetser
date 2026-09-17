# AssanPay API Console & Testing Workspace

An enterprise-grade internal API testing, debugging, and webhook inspection workspace engineered specifically for the **AssanPay Support and Technical Engineering teams**.

Built with **Next.js (App Router)**, **Neon PostgreSQL**, **Drizzle ORM**, **Auth.js**, and **Tailwind CSS**, this tool empowers support engineers to debug merchant integration issues, inspect canonical signing headers, test API endpoints, receive callbacks in real-time, and maintain comprehensive audit logs across multiple countries (Pakistan 🇵🇰, Bangladesh 🇧🇩, and future markets).

---

## Architecture Overview

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | Vercel-native serverless functions & React Server Components |
| **Database** | Neon PostgreSQL (Serverless) | Relational persistence with JSONB headers/bodies & foreign keys |
| **ORM** | Drizzle ORM & Drizzle Kit | Type-safe migrations and queries |
| **Authentication** | Auth.js (NextAuth v5 Beta) | Google OAuth strictly restricted to `@assanpay.com` |
| **Cryptography** | Node.js Crypto (`crypto.subtle` / `crypto`) | HMAC-SHA256 request signing & AES-256-GCM secret vault |
| **Validation** | Zod | Strict schema validation for all API inputs |
| **UI Design** | Tailwind CSS v4 & shadcn/ui | Dark developer-console layout (Desktop, Tablet, Mobile) |

---

## Key Features

### 1. Multi-Country & Dual Environment Architecture
- **Global Country Selector**: Seamlessly switch between **Pakistan (PKR)** and **Bangladesh (BDT)**. Built to support future countries without restructuring application code.
- **Environment Switcher**: Toggle between **Sandbox** and **Production**.
- **Live Production Alert**: High-visibility warning badge when connected to Production.
- **Payout Safety Confirmation**: Modal safeguard before executing money-movement or wallet-disbursement endpoints in Production.

### 2. Cryptographic Security & Request Signing
- **HMAC-SHA256 Outbound Signatures**: Formulated per the official AssanPay specification:
  ```text
  bodyHash = SHA256(requestBody)
  canonical = METHOD + "\n" + PATH_WITH_QUERY + "\n" + TIMESTAMP + "\n" + NONCE + "\n" + BODY_HASH
  signature = Base64(HMAC-SHA256(canonical, API_SECRET))
  ```
- **Status Inquiry Exemption**: As documented in the AssanPay manual, `/api/merchant/status-inquiry` automatically omits signature headers and relies on `X-API-KEY`.
- **SSRF Prevention**: Strict outbound host verification against configured AssanPay origins. Blocks loopback (`127.0.0.1`, `localhost`), private RFC 1918 subnets, and cloud metadata addresses (`169.254.169.254`).
- **Zero Client-Side Secrets**: `API_KEY` and `API_SECRET` are stored exclusively in server environment variables. `/api/config` only returns boolean readiness flags.
- **Current Encryption Decision**: Plaintext request/response payload transmission is currently active (`encryptionMode: 'none'`), while the codebase maintains modularity to re-enable payload encryption if required.

### 3. Postman-Style Request Workbench
- **Method Selector**: Support for `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- **Params Tab**: Editable query parameters table with live synchronization to the relative URL.
- **Headers Tab**: Custom headers table paired with real-time generated security headers preview (`X-API-KEY`, `X-TIMESTAMP`, `X-NONCE`, `X-SIGNATURE`, `Content-Type`).
- **Body Tab**: JSON editor featuring syntax validation and one-click JSON beautification.
- **Postman Variables**: Interpolates `{{orderId}}`, `{{amount}}`, `{{customerMobile}}`, etc. across paths, query params, headers, and request bodies.
- **Keyboard Shortcuts**:
  - `Ctrl + Enter` (or `Cmd + Enter`): Send Request
  - `Ctrl + S` (or `Cmd + S`): Save to Collection

### 4. Comprehensive Response Inspector
- **Header Metrics**: HTTP status code with color-coded badge, execution latency (ms), response size (KB), request UUID.
- **Inspection Tabs**:
  - **Pretty JSON**: Formatted and syntax-highlighted response.
  - **Raw**: Exact upstream byte-for-byte response body.
  - **Response Headers**: Full table of upstream HTTP headers.
  - **Request Details**: Exact outbound sanitized headers, method, final URL, and payload.
  - **Metadata**: Target gateway origin, HMAC status, encryption flags, executing user.
- **One-Click Copy**: Copy JSON, Copy Raw, or Copy Headers to clipboard.
- **Unknown Outcome Warning**: For network timeouts on financial endpoints:
  > *"Request outcome is unknown. The request may have reached AssanPay. Check transaction status before retrying."*

### 5. Webhook / Callback Receiver & Live Inbox
- **Public Webhook Route**:
  ```
  POST /api/callbacks/assanpay/{country}/{environment}
  ```
  *(No Google login required; openly reachable by AssanPay servers)*
- **Raw-Body Signature Verification**: Reads `await request.text()` before JSON parsing and validates against `${eventId}\n${timestamp}\n${rawBody}` using constant-time comparison (`crypto.timingSafeEqual`).
- **Separate Credentials**: Outgoing requests use the branch API key and branch API secret. Incoming callbacks use `ASSANPAY_{COUNTRY}_{ENV}_MAIN_API_SECRET` (main merchant secret) only; there is no branch-secret fallback.
- **Callback Inbox UI**:
  - Live auto-refresh polling (5s interval) with manual refresh button.
  - Filter by Country, Environment, or Verification status (Verified vs Invalid).
  - Event Inspector with parsed payload, raw body, headers, and signature math breakdown.
  - Automatic deduplication on `X-Assanpay-Event-Id`.

### 6. Audit History & Saved Collections
- **Centralized Audit Sanitizer**: `sanitizeForAudit()` masks OTPs, PINs, passwords, auth tokens, and account numbers prior to database storage.
- **Load into Workbench**: Replay or modify previous requests from history without automatic re-execution.
- **User Collections**: Save, rename, search, and manage custom API request templates.

---

## Getting Started

### 1. Prerequisites
- **Node.js**: `v22+` (v24 LTS recommended)
- **Database**: Neon PostgreSQL instance
- **Google Cloud Console**: OAuth 2.0 Web Application credentials

### 2. Environment Configuration
Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Key environment variables:
```ini
# Application
APP_URL=http://localhost:3000

# Neon PostgreSQL
DATABASE_URL=postgresql://user:pass@ep-sample-pooler.region.aws.neon.tech/neondb?sslmode=require

# Auth.js (NextAuth v5)
AUTH_SECRET=your_32_byte_base64_secret
AUTH_GOOGLE_ID=your_client_id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-your_client_secret

# Optional local dev bypass (offline development)
DEV_BYPASS_AUTH=false


# Gateway credentials (server-only; see .env.example for all four countries)
ASSANPAY_PKR_BASE_URL=https://pc.assanpay.com/
ASSANPAY_PKR_API_KEY=your_branch_key
ASSANPAY_PKR_API_SECRET=your_branch_secret
ASSANPAY_PKR_MAIN_API_SECRET=your_main_merchant_secret_for_callbacks

ASSANPAY_BDT_BASE_URL=https://bn3.assanpay.com/
ASSANPAY_BDT_API_KEY=your_branch_key
ASSANPAY_BDT_API_SECRET=your_branch_secret
ASSANPAY_BDT_MAIN_API_SECRET=your_main_merchant_secret_for_callbacks

ASSANPAY_IDR_BASE_URL=https://id-sandbox.assanpay.com/
ASSANPAY_IDR_API_KEY=your_branch_key
ASSANPAY_IDR_API_SECRET=your_branch_secret
ASSANPAY_IDR_MAIN_API_SECRET=your_main_merchant_secret_for_callbacks

ASSANPAY_PHP_BASE_URL=https://ph-sandbox.assanpay.com/
ASSANPAY_PHP_API_KEY=your_branch_key
ASSANPAY_PHP_API_SECRET=your_branch_secret
ASSANPAY_PHP_MAIN_API_SECRET=your_main_merchant_secret_for_callbacks
```

For Vercel, add these variables in Project Settings -> Environment Variables, with `APP_URL` set to the deployed HTTPS domain. Add only the names in `.env.example`, and never commit real secrets.

### 3. Database Migration & Seeding
Generate and run migrations, then seed initial Pakistan & Bangladesh endpoint catalogs:

```bash
# Generate SQL migrations
npm run db:generate

# Apply migrations to Neon PostgreSQL
npm run db:migrate

# Seed countries and preconfigured endpoints
npm run db:seed
```

### 4. Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Google OAuth Setup Guide

1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** with Application Type: **Web Application**.
3. Add **Authorized JavaScript Origins**:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.vercel.app` (or custom domain `https://console.assanpay.com`)
4. Add **Authorized Redirect URIs**:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.vercel.app/api/auth/callback/google`
5. Copy Client ID into `AUTH_GOOGLE_ID` and Client Secret into `AUTH_GOOGLE_SECRET`.

> [!IMPORTANT]
> **Domain Restriction**:
> While `hd: 'assanpay.com'` is provided to Google as a UX hint, the application **strictly verifies the email domain server-side** in the NextAuth `signIn` callback:
> - Verified Google email extracted.
> - Email normalized to lowercase.
> - Portion after final `@` must equal exactly `assanpay.com`.
> - Any non-AssanPay account is blocked and redirected to `/login?error=AccessDenied`.

---

## Automated Tests

Run the comprehensive unit, cryptographic, and security test suites:

```bash
npm test
```

### Verified Test Suites:
1. **Authentication & Domain Validation**: Verifies acceptance of `@assanpay.com` and rejection of Gmail, Yahoo, lookalike domains (`fakeassanpay.com`, `assanpay.co`), and unverified emails.
2. **Postman Variable Resolver**: Verifies recursive `{{key}}` interpolation across URLs, query params, headers, and request bodies.
3. **SSRF Host Protection & Audit Sanitization**: Verifies blocking of external hosts, localhost, 127.0.0.1, AWS/GCP metadata addresses (`169.254.169.254`), and validates intelligent PII/credential masking.
4. **HMAC-SHA256 Signing**: Validates canonical string composition, lowercase SHA256 body hashing, and Base64 signature generation against the official manual worked example.
5. **Webhook Callback Verification**: Validates raw-body signature verification, tampered body rejection, and missing header checks.

---

## Vercel Deployment

1. Import the repository into your [Vercel Dashboard](https://vercel.com).
2. Set the Root Directory to `app/`.
3. Add all environment variables from `.env.example` in the Vercel Project Settings.
4. Set Framework Preset to **Next.js**.
5. Deploy! Production builds and route handlers run out of the box.
