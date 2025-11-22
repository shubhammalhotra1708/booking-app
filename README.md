# Anonymous → Claimed Account Flow

This app now uses Supabase Anonymous Auth for frictionless first bookings.

## Lifecycle
1. Visitor arrives with no session → we start an anonymous session (`signInAnonymously`).
2. Booking form collects name / phone / optional email but does NOT create a password account.
3. We ensure a `Customer` row linked to the anonymous `auth.users.id` (metadata: `anonymous:true`, `temp_account:true`).
4. User can make bookings; identity continuity preserved via anonymous user id.
5. When user clicks “Set Password” banner, we call `/api/auth/upgrade` which:
	- Calls `auth.updateUser({ email, password, data: { anonymous:false, temp_account:false } })`.
	- Updates `Customer.email` if a real email provided.
6. Future logins use the provided email/password; anonymous metadata cleared.

## Key Differences vs Previous Flow
| Old Flow | New Flow |
|----------|----------|
| Auto random password sign-up on first booking | Starts anonymous session instead |
| Alias emails like `phone@phone.local` persisted | Alias email avoided; real email only on upgrade |
| Claim required merging guest row | Anonymous user id already links bookings |
| Harder to explain hidden password | User explicitly sets credentials when ready |

## Upgrade Endpoint
`POST /api/auth/upgrade { email, password, name?, phone? }` converts the anonymous account.

## Customer Consistency
`ensureCustomerRecord()` runs after anonymous creation & after upgrade to keep Customer synchronized while respecting uniqueness constraints.

## Future Enhancements
- Phone OTP for upgrade instead of immediate password.
- Rate limiting upgrade attempts.
- UI to display verification status / resend flows.

# 🏪 Beauty Booking System - Customer App

The customer-facing platform for discovering and booking beauty services.

> **📖 Complete Documentation**: See `/PROJECT_CONTEXT.md` in the root directory for complete system context and development guide.

## 🚀 Quick Start

```bash
npm install
npm run dev  # Runs on http://localhost:3000
```

## 🎯 Purpose

This app provides customers with:
- Shop discovery and browsing
- Service catalog with pricing
- Staff selection for appointments  
- Booking flow (in development)
- Public access (no authentication required)

## 🔗 Related Apps

- **Salon Admin**: `/salon-admin/` - Business management dashboard (Port 3001)
- **Database**: Shared Supabase database with RLS security

## 🧪 Testing

- **Interactive API Testing**: http://localhost:3000/test-api
- **Debug Endpoints**: `/api/debug` and `/api/debug-service`

## 📚 Documentation

## 📚 Documentation

- [Complete Backend Guide](./COMPLETE_BACKEND_GUIDE.md) - **🎯 Single source of truth for backend architecture, policies, security, and development**
- [Project Overview](../PROJECT_OVERVIEW.md) - Full system overview
- [Development Guide](../DEVELOPMENT_GUIDE.md) - Setup and workflow guide
- [Project Status](../PROJECT_STATUS.md) - Current development status
