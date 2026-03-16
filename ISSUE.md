# Codebase Audit Report

Date: 2026-03-15

---

## Linting
- **ESLint**: No warnings or errors
- **Tests**: 191 passed, 5 failed (failures in `MessageList.test.tsx`)

---

## High Priority Issues

### 1. Security: Hardcoded JWT Secret Fallback
**File**: `src/lib/auth.ts:6-8`
```typescript
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "development-secret-key"
);
```
**Issue**: Falls back to a hardcoded secret in production if `JWT_SECRET` is not set. This would allow attackers to forge sessions.

**Recommendation**: Fail fast if `JWT_SECRET` is missing in production:
```typescript
const JWT_SECRET = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : (process.env.NODE_ENV === "production"
      ? (() => { throw new Error("JWT_SECRET must be set in production"); })()
      : new TextEncoder().encode("development-secret-key"));
```

### 2. Security: No Rate Limiting on `/api/chat`
**File**: `src/app/api/chat/route.ts`
**Issue**: The chat endpoint has no rate limiting, allowing potential abuse or cost escalation with AI API calls.

**Recommendation**: Add rate limiting using a library like `rate-limiter-flexible`.

---

## Medium Priority Issues

### 3. Input Validation: Missing Server-Side Validation
**File**: `src/app/api/chat/route.ts:11-17`
```typescript
const { messages, files, projectId } = await req.json();
```
**Issue**: No schema validation on the request body.

**Recommendation**: Use Zod to validate:
```typescript
const ChatRequest = z.object({
  messages: z.array(z.any()),
  files: z.record(z.any()),
  projectId: z.string().optional(),
});
```

### 4. Auth: Project Access Control Gap
**File**: `src/app/api/chat/route.ts:48-78`
**Issue**: When saving a project, user authentication is checked in `onFinish` callback (after the AI has already run). If auth fails, the expensive AI operation completes but work is lost.

**Recommendation**: Check authentication at the start of the handler, not in `onFinish`.

### 5. Security: No CSRF Protection on Server Actions
**Files**: `src/actions/index.ts`, `src/actions/create-project.ts`
**Issue**: Server actions in Next.js don't have built-in CSRF protection by default.

**Recommendation**: Next.js 15+ has some built-in protection, but verify and consider adding explicit CSRF tokens for sensitive operations.

---

## Low Priority Issues

### 6. Test Failures
**File**: `src/components/chat/__tests__/MessageList.test.tsx:81`
**Issue**: 5 tests failing - likely due to React 19 or testing library changes.

**Recommendation**: Update test assertions to use `expect(...).toBeInTheDocument()` instead of `getByText` with `.toBeDefined()`.

### 7. Missing Email Validation
**File**: `src/actions/index.ts:14-28`
**Issue**: Only checks for empty email, no format validation.

**Recommendation**: Add regex or use a library like `zod` with email validation.

### 8. Missing Password Strength Validation
**File**: `src/actions/index.ts:24-28`
**Issue**: Only checks for minimum 8 characters, no complexity requirements.

---

## Code Quality Notes

### 9. Type Safety
- Several `any` types: `src/app/api/chat/route.ts:16`, `src/actions/create-project.ts:8`
- No strict TypeScript mode in `tsconfig.json`

### 10. Missing Features
- No visible logout button in the UI (only `signOut` action exists)
- No password reset functionality

---

## Positive Findings

1. **Good**: JWT implementation uses proper `jose` library with correct algorithm (HS256)
2. **Good**: Passwords properly hashed with bcrypt (cost factor 10)
3. **Good**: HttpOnly, secure cookies in production
4. **Good**: Virtual file system is well-isolated from real filesystem
5. **Good**: Prisma schema uses parameterized queries (safe from SQL injection)
6. **Good**: Good separation of concerns (lib, actions, components)

---

## Recommended Actions

| Priority | Action |
|----------|--------|
| **High** | Add `JWT_SECRET` environment variable validation |
| **High** | Add rate limiting to `/api/chat` |
| **Medium** | Move auth check to start of chat handler |
| **Medium** | Add Zod validation for API requests |
| **Low** | Fix failing tests |
| **Low** | Add email format validation |