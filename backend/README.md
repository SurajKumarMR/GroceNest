# GroceNest Backend - Security Hardened

This version of the GroceNest backend has been hardened for production readiness.

## Security Features

### 1. Authentication
- **Asymmetric JWT (RS256)**: Tokens are signed with a private RSA key and verified with a public key.
- **Refresh Token Rotation**: Secure session management with rotation and reuse detection.
- **Secure Cookies**: Refresh tokens are stored in `httpOnly`, `Secure`, `SameSite=Strict` cookies.
- **Account Lockout**: Automatic 15-minute lockout after 5 failed login attempts.

### 2. Password Security
- **Complexity**: Enforced via Zod (min 8 chars, 1 uppercase, 1 number, 1 special char).
- **Breach Detection**: Integration with HaveIBeenPwned API to block compromised passwords.

### 3. API Protection
- **Rate Limiting**: Granular limits for Auth (10/hr), Payments (2/15s), and General (100/15min).
- **Security Headers**: Strict Helmet configuration (CSP, HSTS, X-Frame-Options).
- **CORS**: Strict origin allowlist configured via `ALLOWED_ORIGINS`.

### 4. Payment Security
- **Webhook Signature Verification**: Mandatory for all Stripe webhooks.
- **Idempotency**: Prevents double-processing of Stripe events.
- **Server-side Pricing Validation**: Totals are verified on the server before payment initiation.

## Setup

1. **Environment Variables**: Ensure `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` are set in `.env` (properly escaped `\n`).
2. **Audit**: Run `npm run audit` to check for dependency vulnerabilities.
