# Super Admin Architecture - Security-First Design

## 🎯 Design Principles

This Super Admin system is **completely isolated** from the tenant/user system. This separation ensures:

1. **Security**: No cross-contamination between admin and tenant auth
2. **Clarity**: Explicit code paths make it easier to audit and maintain
3. **Compliance**: Separate audit trails for admin actions
4. **Scalability**: Can evolve independently from tenant system

## 🔒 Security Isolation

### ✅ What We DO

- **Separate Tables**: `SuperAdmin` table, NOT reusing `User`
- **Separate Auth**: `super-admin-auth.ts`, NOT using `auth.ts`
- **Separate Sessions**: `super_admin_session` cookie, NOT NextAuth sessions
- **Separate Middleware**: `middleware-super-admin.ts`, NOT tenant middleware
- **Separate Routes**: `/super-admin/*`, NOT `/admin/*` or `/app/*`
- **Separate Guards**: `super-admin-guards.ts`, NOT user auth helpers
- **Separate API Routes**: `/api/super-admin/*`, NOT `/api/auth/*`

### ❌ What We NEVER DO

- ❌ Reuse `User` table for admins
- ❌ Check `user.id` or `user.email` from tenant context
- ❌ Use NextAuth sessions for Super Admins
- ❌ Share middleware logic between admin and tenant
- ❌ Import tenant auth helpers in admin code
- ❌ Use wildcard service role in runtime code

## 📁 Folder Structure

```
src/
├── app/
│   ├── super-admin/           # ISOLATED admin routes
│   │   ├── login/
│   │   │   └── page.tsx       # Separate login page
│   │   ├── dashboard/
│   │   │   └── page.tsx       # Admin dashboard
│   │   ├── organizations/
│   │   │   ├── page.tsx       # List organizations
│   │   │   └── [id]/
│   │   │       └── page.tsx   # Organization details
│   │   └── layout.tsx         # Admin-only layout guard
│   │
│   ├── api/
│   │   └── super-admin/       # ISOLATED admin API
│   │       └── auth/
│   │           ├── login/
│   │           │   └── route.ts
│   │           └── logout/
│   │               └── route.ts
│   │
│   └── app/                   # TENANT routes (untouched)
│
├── lib/
│   ├── super-admin-auth.ts    # ISOLATED auth logic
│   ├── super-admin-rbac.ts    # Role-based access control
│   ├── super-admin-guards.ts  # Server-side guards
│   └── super-admin-audit.ts   # Audit logging
│
├── middleware-super-admin.ts  # ISOLATED middleware
└── middleware.ts              # Main middleware (calls super-admin first)
```

## 🔐 Authentication Flow

### Login Flow

1. User visits `/super-admin/login`
2. `superAdminMiddleware` allows access (public route)
3. Form submits to `/api/super-admin/auth/login`
4. `authenticateSuperAdmin()` checks **ONLY** `SuperAdmin` table
5. `createSuperAdminSession()` creates JWT + cookie
6. Redirect to `/super-admin/dashboard`

### Session Management

- **Cookie**: `super_admin_session` (httpOnly, secure, path: `/super-admin`)
- **JWT**: Contains `{ id, email, name, role }`
- **Validation**: `getSuperAdminSession()` verifies JWT + checks DB
- **Expiration**: 7 days (configurable)

### Protection Flow

1. User visits `/super-admin/dashboard`
2. `superAdminMiddleware` checks cookie
3. If no session → redirect to `/super-admin/login`
4. Layout calls `requireSuperAdminAuth()` (double-check)
5. Page loads with session context

## 🛡️ Authorization (RBAC)

### Roles

- **super_admin**: Full system access
- **support_admin**: Read/write orgs & users, no billing deletion
- **read_only_admin**: Read-only access

### Permission Checks

```typescript
// In API routes
const session = await requireSuperAdminPermissionApi("organization", "update")
if (session instanceof NextResponse) {
  return session // Error response
}
// Continue with action

// In Server Components
await requireSuperAdminPermission("organization", "read")
// Throws redirect if no permission
```

### Permission Matrix

See `src/lib/super-admin-rbac.ts` for full matrix.

## 📊 Database Schema

### Core Tables

```prisma
SuperAdmin {
  id, email, passwordHash, name, role, isActive, lastLoginAt
}

SuperAdmin2FA {
  id, superAdminId, secret, enabled, backupCodes
}

SuperAdminSession {
  id, superAdminId, token, expiresAt, ipAddress, userAgent
}

AuditLog {
  id, superAdminId, action, entityType, entityId, before, after, timestamp
}
```

### Feature Management

```prisma
Subscription {
  id, organizationId, plan, status, stripeSubscriptionId, ...
}

Feature {
  id, key, name, description, defaultEnabled
}

OrganizationFeature {
  id, organizationId, featureId, enabled
}
```

### Template Management

```prisma
Template {
  id, name, industry, version, schemaJson, isActive
}
```

**Note**: No Foreign Keys to `Organization` or `User` tables for isolation.

## 🔍 Audit Logging

Every Super Admin action should be logged:

```typescript
await createAuditLog({
  action: "organization.suspend",
  entityType: "organization",
  entityId: orgId,
  before: { status: "active" },
  after: { status: "suspended" },
  ipAddress: getClientIp(request),
  userAgent: getClientUserAgent(request)
})
```

## 🚀 Why This Avoids Previous Failures

### Previous Issues

1. **Shared Auth**: Admins using same login as users
2. **Role Confusion**: `systemRole` field mixed with tenant roles
3. **Cross-Contamination**: Admin code importing user auth helpers
4. **Weak Isolation**: RLS policies not properly separated

### Our Solution

1. **Complete Separation**: 
   - Separate tables (`SuperAdmin` vs `User`)
   - Separate auth (`super-admin-auth.ts` vs `auth.ts`)
   - Separate routes (`/super-admin/*` vs `/app/*`)

2. **Explicit Guards**:
   - `requireSuperAdminAuth()` - explicit admin check
   - `requireSuperAdminPermission()` - explicit permission check
   - No implicit role inheritance

3. **No Reuse**:
   - Never import `auth()` from `auth.ts` in admin code
   - Never check `user.id` in admin context
   - Never use tenant middleware for admin routes

4. **Server-Side Only**:
   - All checks happen server-side
   - Frontend only shows/hides UI, never enforces security

## 🔄 Next Steps

1. **2FA Implementation**: Add TOTP for Super Admins
2. **Feature Flags**: Implement organization-specific feature toggles
3. **Subscription Management**: Full CRUD for subscriptions
4. **Template Management**: Create/edit DPP templates
5. **Audit Log UI**: View and filter audit logs
6. **Admin Management**: Create/edit Super Admins (super_admin only)

## ⚠️ Security Checklist

- [x] Separate authentication system
- [x] Separate session management
- [x] Separate middleware
- [x] Separate database tables
- [x] RBAC with explicit permissions
- [x] Audit logging for all actions
- [x] Server-side authorization only
- [ ] 2FA enforcement (optional)
- [ ] Rate limiting on login
- [ ] Session invalidation on role change
- [ ] IP whitelisting (optional)

