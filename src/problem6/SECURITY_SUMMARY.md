# Security & Anti-Fraud - Strategy Summary

> Concise summary of security and anti-fraud solutions for the Score Board System

---

## 🔑 I. AUTHENTICATION AND AUTHORIZATION

### JWT-based Authentication
- **Token Structure**: JWT contains user_id, username, permissions, expiration
- **Token Types**: 
  - Access Token: Short-lived (1-24h) for API requests
  - Refresh Token: Long-lived (7-30 days) to renew access token
- **Storage**: 
  - Client: HttpOnly cookies or secure storage
  - Server: Redis to track active sessions and blacklist
- **Validation**: Middleware verifies signature and expiration on each request

### Role-based Access Control (RBAC)
- **Roles**: User, Admin, Moderator
- **Permissions**: 
  - `EXECUTE_ACTION`: Execute actions to earn points
  - `VIEW_SCOREBOARD`: View leaderboard
  - `MODERATE_USERS`: Admin can suspend/ban users
  - `VIEW_ANALYTICS`: View fraud detection reports
- **Implementation**: Permission-based middleware checks before each protected endpoint

**Authentication Flow**:
```
1. Login → Server generates JWT with permissions
2. Client stores token and sends in Authorization header
3. Server verifies token on each request
4. Check permissions for specific action
5. Allow or reject request
```

---

## 🔐 II. REQUEST SIGNING

### HMAC-SHA256 Signature
**Purpose**: Ensure requests are not forged or replayed

**How it works**:
```javascript
// Client-side
const nonce = generateUUID();
const timestamp = Date.now();
const payload = JSON.stringify(actionData);
const message = `${payload}|${nonce}|${timestamp}|${userId}`;
const signature = HMAC_SHA256(sharedSecret, message);

// Send to server
POST /api/actions/execute
Headers: {
  X-Signature: signature,
  X-Nonce: nonce,
  X-Timestamp: timestamp
}
Body: actionData
```

**Server Validation**:
1. ✅ Check timestamp: `now - timestamp < 60 seconds` (prevent stale requests)
2. ✅ Check nonce: Query Redis, reject if already exists (prevent replay)
3. ✅ Verify signature: Recalculate signature and compare
4. ✅ Store nonce: Save in Redis with TTL 5 minutes
5. ✅ Process request if all pass

**Benefits**:
- ✓ Prevents replay attacks (nonce + timestamp)
- ✓ Prevents tampering (signature verification)
- ✓ Lightweight (no need to encrypt entire payload)
- ✓ Stateless (only need Redis for nonce tracking)

**Shared Secret Management**:
- Generated when user logs in
- Unique per session
- Stored securely in Redis
- Auto-expires when session ends

---

## 🚫 III. ZERO-TRUST SCORE CALCULATION

### Golden Rule
**NEVER trust score data from client**

### Bad vs Good Practice

❌ **WRONG - Client sends desired score**:
```javascript
// Client
POST /api/actions/execute
{
  "action": "COMPLETE_TASK",
  "taskId": "123",
  "pointsRequested": 100  // ❌ Client can fake
}

// Server (WRONG)
const points = request.body.pointsRequested; // ❌ Trust client
user.score += points;
```

✅ **CORRECT - Server calculates everything**:
```javascript
// Client only sends action claim
POST /api/actions/execute
{
  "action": "COMPLETE_TASK",
  "taskId": "123",
  "metadata": { "completionTime": 120 }  // ✓ Only metadata
}

// Server validates and calculates
async function processAction(userId, actionType, metadata) {
  // 1. VALIDATE preconditions
  const task = await getTask(metadata.taskId);
  if (!task) throw "TASK_NOT_FOUND";
  if (task.userId !== userId) throw "UNAUTHORIZED";
  if (task.completed) throw "ALREADY_COMPLETED";
  
  // 2. CALCULATE score (server-side logic)
  let points = SCORE_TABLE[actionType]; // Base score from config
  
  // Apply multipliers
  if (metadata.completionTime < 60) {
    points *= 1.5; // Quick completion bonus
  }
  
  // Apply business rules
  const userLevel = await getUserLevel(userId);
  points *= LEVEL_MULTIPLIERS[userLevel];
  
  // 3. AWARD points
  await updateUserScore(userId, points);
  
  return { pointsAwarded: points };
}
```

### Server-side Validation Checklist

**Pre-conditions**:
- ✅ User exists and active
- ✅ Action type valid
- ✅ Resource (task/item) exists
- ✅ User has permission to perform action
- ✅ Action not completed before
- ✅ Time window valid (if any)
- ✅ Dependencies satisfied

**Business Rules**:
- ✅ Cooldown period respected
- ✅ Daily/weekly limits not exceeded
- ✅ Cost/requirements met
- ✅ No conflicting states

**Score Calculation**:
- ✅ Base score from server config
- ✅ Multipliers based on conditions
- ✅ Penalties for violations
- ✅ Final score = calculated value

**Benefits**:
- ✓ 100% accurate scoring
- ✓ Impossible to cheat points
- ✓ Consistent business logic
- ✓ Complete audit trail

---

## ⏱️ IV. RATE LIMITING

### Multi-tier Rate Limiting Strategy

#### Tier 1: Global Limits (Network Level)
**Purpose**: Prevent DDoS attacks
```javascript
// Per IP address
Global: 1000 requests/minute per IP
```
**Implementation**: Nginx/API Gateway level

#### Tier 2: User Limits (Authentication Level)
**Purpose**: Fair usage per user
```javascript
Authenticated users: 100 requests/minute
Anonymous users: 10 requests/minute
Premium users: 200 requests/minute
```
**Implementation**: Application middleware with Redis

#### Tier 3: Action-specific Limits (Business Logic Level)
**Purpose**: Prevent specific action abuse
```javascript
Score-bearing actions:
  - COMPLETE_TASK: 20/hour
  - DAILY_LOGIN: 1/day
  - SHARE_CONTENT: 10/hour
  
Read-only actions:
  - GET_SCOREBOARD: 120/hour
  - GET_PROFILE: 60/hour
```
**Implementation**: Per-endpoint rate limiters

#### Tier 4: Dynamic Adaptive Limits
**Purpose**: Adjust based on behavior
```javascript
Normal user: Standard limits
Suspicious user: Limits × 0.5
Trusted user: Limits × 1.5
VIP user: Limits × 2
```
**Implementation**: Real-time reputation scoring

### Rate Limiting Algorithms

#### 1. Sliding Window (Recommended)
**Why better than fixed window**:
- Prevent burst at window boundaries
- More accurate representation
- Fairer distribution

**Implementation with Redis**:
```javascript
// Use Redis Sorted Set
const key = `rate_limit:${userId}:${action}`;
const now = Date.now();
const windowSize = 60000; // 1 minute

// Remove old entries
await redis.zremrangebyscore(key, 0, now - windowSize);

// Count current requests
const count = await redis.zcard(key);

if (count >= limit) {
  throw new Error('RATE_LIMIT_EXCEEDED');
}

// Add current request
await redis.zadd(key, now, `${now}-${uuid()}`);
await redis.expire(key, Math.ceil(windowSize / 1000));
```

#### 2. Token Bucket
**For complex scenarios**:
```javascript
Concept:
- Bucket capacity: 100 tokens (max burst)
- Refill rate: 10 tokens/minute (sustained rate)
- Action cost: COMPLETE_TASK = 5 tokens

Benefits:
- Allow controlled bursts
- Smooth traffic over time
- Different costs for different actions
```

### Response Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 2023-10-08T10:30:00Z
Retry-After: 30
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "retryAfter": 30,
    "limit": 100,
    "remaining": 0,
    "resetAt": "2023-10-08T10:30:00Z"
  }
}
```

### Benefits
- ✓ Prevent spam and abuse
- ✓ Fair resource allocation
- ✓ Protect infrastructure
- ✓ Detect suspicious behavior
- ✓ Improve system stability

---

## 💡 KEY TAKEAWAYS

1. **Authentication First** → JWT + RBAC as foundation for all security measures
2. **Request Integrity** → HMAC signing prevents replay and tampering attacks
3. **Server Authority** → Zero-trust: Server calculates 100% of score, never trust client
4. **Rate Limiting** → Multi-tier protection against spam, abuse, and DDoS
5. **Defense in Depth** → Combine all 4 layers for comprehensive protection

---

## 📝 IMPLEMENTATION PRIORITY

### Phase 1: Core Security (Week 1)
1. ✅ JWT Authentication + RBAC
2. ✅ Basic rate limiting (Global + User level)
3. ✅ Server-side score calculation
4. ✅ Input validation

### Phase 2: Advanced Protection (Week 2-3)
1. ✅ Request signing with HMAC
2. ✅ Multi-tier rate limiting
3. ✅ Action-specific validation
4. ✅ Audit logging

### Phase 3: Optimization (Week 4+)
1. ✅ Performance tuning
2. ✅ Redis optimization
3. ✅ Monitoring dashboards
4. ✅ Alert systems

---

## 🎯 SUCCESS METRICS

| Metric | Target |
|--------|--------|
| Authentication Success Rate | > 99% |
| Request Signature Verification | 100% |
| Fraud Prevention Rate | > 99.9% |
| Rate Limit Effectiveness | < 0.1% abuse |
| System Uptime | 99.9% |
| Latency Overhead | < 50ms |
