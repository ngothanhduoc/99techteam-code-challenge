# API Gateway Layer - Implementation Guide

## Overview

API Gateway is the **first line of defense** in the Score Board system, handling 3 main security layers before requests reach business logic services.

---

## 🏗️ API GATEWAY ARCHITECTURE

### Layered Structure

```
┌─────────────────────────────────────────────────────────┐
│                    NGINX (Layer 1)                      │
│  • DDoS Protection                                      │
│  • Global Rate Limiting (per IP)                        │
│  • SSL Termination                                      │
│  • Load Balancing                                       │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────┐
│            Application Layer (Express/NestJS)           │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Middleware 1: Rate Limiting (User/Action)       │  │
│  └──────────────────────┬───────────────────────────┘  │
│                         ↓                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Middleware 2: JWT Authentication                │  │
│  └──────────────────────┬───────────────────────────┘  │
│                         ↓                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Middleware 3: Request Signing Verification      │  │
│  └──────────────────────┬───────────────────────────┘  │
│                         ↓                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Route Handler (Business Logic)                  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Technology Selection

**Option 1: Nginx + Application Middleware** (Recommended)
- ✅ Nginx handles network-level protection (DDoS, SSL, Load balancing)
- ✅ Application middleware handles business-level security
- ✅ Flexible and easy to customize
- ✅ Low cost

**Option 2: Dedicated API Gateway** (Kong, Tyk, AWS API Gateway)
- ✅ Out-of-the-box features with plugin ecosystem
- ✅ Enterprise support and scaling
- ❌ Higher cost
- ❌ Vendor lock-in risk

---

## 🔴 LAYER 1: RATE LIMITING (4-TIER)

### Tiered Strategy

#### Tier 1: Global Rate Limiting (Network Level)
**Purpose**: Prevent DDoS attacks

**Implementation**:
- Configure Nginx with `limit_req_zone` and `limit_conn_zone`
- Limit by IP address: 100-1000 requests/second
- Connection limit: 10-20 concurrent connections per IP
- Return HTTP 429 when exceeded

**Best Practices**:
- ✅ Whitelist trusted IPs (monitoring, health checks)
- ✅ Geolocation filtering if needed
- ✅ Burst allowance for legitimate spikes
- ✅ Log violations for analysis

#### Tier 2: User-based Rate Limiting (Application Level)
**Purpose**: Fair usage per user

**Implementation**:
- Middleware check with Redis
- Key: `ratelimit:user:{userId}`
- Authenticated users: 100 req/minute
- Anonymous users: 10 req/minute
- Premium users: 200 req/minute

**Best Practices**:
- ✅ Sliding window algorithm (better than fixed window)
- ✅ Differentiate based on user tier
- ✅ Grace period for new users
- ✅ Clear error messages with retry-after header

#### Tier 3: Action-specific Rate Limiting
**Purpose**: Prevent action abuse

**Implementation**:
- Key: `ratelimit:action:{actionType}:{userId}`
- Different limits for each action type:
  - `COMPLETE_TASK`: 20/hour
  - `DAILY_LOGIN`: 1/day
  - `SHARE_CONTENT`: 10/hour
  - Read-only actions: Loose limits

**Best Practices**:
- ✅ Business-driven limits based on requirements
- ✅ Cooldown periods for valuable actions
- ✅ Reset daily/weekly based on action type
- ✅ Monitor and adjust based on patterns

#### Tier 4: Dynamic Adaptive Rate Limiting
**Purpose**: Adjust based on user behavior

**Implementation**:
- Reputation scoring: 0-100
- Calculate based on:
  - Account age (20 points)
  - Past violations (-10 points per violation)
  - Activity patterns (suspicious = -20 points)
  - Successful actions (+1 point per 100 actions)
- Adjust limits: `limit × (reputation / 50)`

**Best Practices**:
- ✅ Cache reputation scores in Redis (TTL 1 hour)
- ✅ Gradual adjustments, no sudden changes
- ✅ Appeal process for false positives
- ✅ Regular recalculation (daily batch job)

### Implementation Considerations

**Storage**: Redis with sorted sets for sliding window
**Performance**: Sub-millisecond latency with Redis
**Scalability**: Redis cluster for high traffic
**Monitoring**: Track limit hits, blocks, and bypass rates

---

## 🟢 LAYER 2: JWT AUTHENTICATION

### Authentication Strategy

#### Token Strategy
**Two-token approach**:
- **Access Token**: Short-lived (1-24 hours) for API requests
- **Refresh Token**: Long-lived (7-30 days) to renew access token

**Token Structure**:
- Payload: userId, username, permissions, issued_at, expires_at
- Algorithm: RS256 (asymmetric) or HS256 (symmetric)
- Signature: Verify integrity

#### Verification Flow
**6-step process**:
1. **Extract token** from Authorization header (`Bearer {token}`)
2. **Check blacklist** in Redis (logged out tokens)
3. **Verify signature** with secret/public key
4. **Check expiration** from `exp` claim
5. **Validate session** in Redis (active sessions only)
6. **Load user context** and attach to request

### Best Practices

#### Security
- ✅ Use HTTPS only to prevent token interception
- ✅ Short token lifetime reduces exposure window
- ✅ Implement token rotation with refresh tokens
- ✅ Blacklist tokens on logout (store in Redis with TTL)
- ✅ Device binding: Track device fingerprint with token
- ✅ IP binding: Alert on IP changes in session

#### Storage
**Client-side**:
- Web: HttpOnly cookies (XSS protection) or secure localStorage
- Mobile: Keychain (iOS) or KeyStore (Android)
- Never store in plain localStorage if possible

**Server-side**:
- Redis for active sessions: `session:{userId}` → {loginTime, device, IP}
- Redis for blacklist: `blacklist:{token}` → 1 (TTL = token expiration)
- PostgreSQL for refresh tokens (long-term storage)

#### Performance
- ✅ Cache valid tokens in Redis (5-10 minutes)
- ✅ Avoid database lookup every request
- ✅ Batch session validation if multiple microservices
- ✅ Async session update (don't block request)

#### RBAC Implementation
**Permissions structure**:
- Roles: `USER`, `ADMIN`, `MODERATOR`
- Permissions: `EXECUTE_ACTION`, `VIEW_SCOREBOARD`, `MODERATE_USERS`
- Hierarchical: ADMIN inherits all USER permissions

**Check strategy**:
- Middleware checks permissions before protected endpoints
- Permission list stored in JWT payload (reduces DB lookups)
- Cache permission matrix in Redis
- Graceful degradation if cache miss

### Error Handling

**Proper HTTP status codes**:
- `401 Unauthorized`: Missing/invalid token
- `403 Forbidden`: Valid token but insufficient permissions
- `419 Session Expired`: Token expired, need refresh

**Response format**:
- Clear error codes: `TOKEN_EXPIRED`, `INVALID_SIGNATURE`, `SESSION_EXPIRED`
- Actionable messages: "Please login again" vs "Invalid token"
- Include retry-after for temporary issues

---

## 🔵 LAYER 3: REQUEST SIGNING VERIFICATION

### HMAC-SHA256 Strategy

#### Signing Process (Client-side)
**6 components**:
1. **Payload**: Request body JSON string
2. **Nonce**: UUID v4 (one-time use)
3. **Timestamp**: Current Unix timestamp (milliseconds)
4. **UserID**: From authenticated session
5. **Shared Secret**: Per-session secret key
6. **Signature**: `HMAC-SHA256(secret, payload|nonce|timestamp|userId)`

**Request headers**:
- `X-Signature`: Hex-encoded HMAC signature
- `X-Nonce`: Unique identifier
- `X-Timestamp`: Request time

#### Verification Process (Server-side)
**7-step validation**:

1. **Extract headers**: Signature, nonce, timestamp
2. **Timestamp check**: 
   - Reject if `now - timestamp > 60 seconds` (stale)
   - Reject if `timestamp > now + 5 seconds` (clock skew tolerance)
3. **Nonce uniqueness**: 
   - Check Redis: `nonce:{nonce}`
   - Reject if exists (replay attack)
4. **Get shared secret**: 
   - Retrieve from Redis: `signing_secret:{userId}`
   - Reject if not found (session invalid)
5. **Calculate signature**: 
   - Reconstruct message: `payload|nonce|timestamp|userId`
   - Compute HMAC-SHA256
6. **Compare signatures**: 
   - Use constant-time comparison (prevent timing attacks)
   - Reject if mismatch
7. **Store nonce**: 
   - Save in Redis with TTL 5 minutes

### Best Practices

#### Security
- ✅ **Constant-time comparison**: Prevent timing attacks
- ✅ **Short time window**: 60 seconds maximum
- ✅ **Nonce storage**: Redis with TTL for auto-cleanup
- ✅ **Secret rotation**: Generate new secret per login session
- ✅ **Shared secret management**: 
  - Generated server-side (32-64 random bytes)
  - Returned in login response
  - Stored securely in Redis with session TTL
  - Never log or expose

#### Performance
- ✅ Redis lookup for nonce check (< 1ms)
- ✅ In-memory HMAC calculation (< 1ms)
- ✅ Total overhead: 2-5ms per request
- ✅ Batch nonce cleanup (scheduled job every hour)

#### Scalability
- ✅ Stateless verification (only need Redis)
- ✅ Horizontal scaling: Multiple servers share Redis
- ✅ Redis cluster for high throughput
- ✅ Nonce sharding by userId if needed

#### Error Handling
**Specific error codes**:
- `MISSING_SIGNATURE_HEADERS`: Headers incomplete
- `STALE_REQUEST`: Timestamp too old
- `FUTURE_REQUEST`: Timestamp in future
- `REPLAY_ATTACK`: Nonce already used
- `INVALID_SIGNATURE`: Signature doesn't match
- `NO_SIGNING_SECRET`: Session has no secret

### Implementation Considerations

**When to require signing**:
- ✅ All score-bearing actions (MUST)
- ✅ Account modifications (MUST)
- ✅ Sensitive operations (MUST)
- ❌ Read-only endpoints (OPTIONAL - balance security vs UX)

**Client implementation**:
- Generate nonce using crypto-safe random
- Synchronize time with NTP
- Handle clock skew gracefully
- Retry with new nonce on failure

---

## 🔧 MIDDLEWARE ORCHESTRATION

### Execution Order (Critical!)

**Correct sequence**:
```
1. Rate Limiting (Tier 1-2)     → Fail fast, save resources
2. JWT Authentication           → Identify user
3. Rate Limiting (Tier 3-4)     → User-specific limits
4. Request Signing              → Verify integrity
5. RBAC Permission Check        → Authorization
6. Business Logic               → Process request
```

**Why this order?**:
- Rate limiting first: Block attacks before wasting CPU
- Auth before signing: Need userId for signature verification
- Action-specific limit after auth: Need user context
- Signing before business logic: Ensure request integrity

### Error Response Strategy

**Standardized format**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {},
    "timestamp": "ISO-8601",
    "requestId": "UUID"
  }
}
```

**HTTP Status Codes**:
- `400`: Validation/signature errors
- `401`: Authentication errors
- `403`: Authorization errors
- `429`: Rate limit exceeded
- `500`: Internal server errors

### Bypass Mechanisms

**Health checks and monitoring**:
- Whitelist specific endpoints: `/health`, `/metrics`
- No authentication required
- Minimal rate limiting
- Direct access for monitoring tools

**Admin operations**:
- Higher rate limits
- Extended token lifetime
- Bypass certain checks with admin flag
- Audit all admin actions
