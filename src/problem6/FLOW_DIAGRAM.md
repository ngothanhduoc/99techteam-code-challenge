# Score Board System - Flow Diagrams

## 1. Main Action Processing Flow

```mermaid
sequenceDiagram
    participant Client
    participant API_Gateway
    participant Auth_Service
    participant Action_Service
    participant Queue
    participant DB
    participant Cache
    participant WebSocket

    Client->>API_Gateway: POST /api/actions/execute
    API_Gateway->>API_Gateway: Rate Limiting Check
    API_Gateway->>Auth_Service: Validate JWT Token
    Auth_Service-->>API_Gateway: User Info
    
    API_Gateway->>Action_Service: Forward Request
    Action_Service->>Action_Service: Validate Action Data
    Action_Service->>Action_Service: Anti-fraud Check
    
    Action_Service->>Queue: Add Action to Processing Queue
    Queue-->>Action_Service: Job ID
    Action_Service-->>Client: 202 Accepted {jobId}
    
    Queue->>Queue: Process Action Job
    Queue->>DB: Begin Transaction
    Queue->>DB: Update User Score
    Queue->>DB: Insert Score History
    Queue->>DB: Insert Action Record
    Queue->>DB: Commit Transaction
    
    Queue->>Cache: Invalidate User Cache
    Queue->>Cache: Invalidate Scoreboard Cache
    
    Queue->>WebSocket: Broadcast Score Update
    WebSocket->>Client: Real-time Score Update
    
    Queue->>Action_Service: Job Completed
    Action_Service->>Client: WebSocket/Polling Result
```

## 2. Real-time Scoreboard Update Flow

```mermaid
flowchart TD
    A[User Action Completed] --> B{Score Changed?}
    B -->|Yes| C[Update User Score in DB]
    B -->|No| Z[End]
    
    C --> D[Calculate New Rank]
    D --> E{Affects Top 10?}
    
    E -->|Yes| F[Invalidate Scoreboard Cache]
    E -->|No| G[Update User Cache Only]
    
    F --> H[Refresh Scoreboard from DB]
    H --> I[Update Scoreboard Cache]
    I --> J[Broadcast to All Subscribers]
    
    G --> K[Update User Cache]
    K --> L[Broadcast to User Subscribers]
    
    J --> M[Send WebSocket Event: scoreboard_updated]
    L --> N[Send WebSocket Event: user_score_updated]
    
    M --> Z
    N --> Z
```

## 3. Authentication and Authorization Flow

```mermaid
sequenceDiagram
    participant Client
    participant API_Gateway
    participant Auth_Service
    participant DB
    participant Cache

    Client->>API_Gateway: POST /api/auth/login
    API_Gateway->>Auth_Service: Login Request
    
    Auth_Service->>DB: Validate Credentials
    DB-->>Auth_Service: User Data
    
    Auth_Service->>Auth_Service: Generate JWT Token
    Auth_Service->>Cache: Store Session Data
    Auth_Service-->>API_Gateway: JWT Token + User Info
    API_Gateway-->>Client: Login Response
    
    Note over Client,Cache: Subsequent Requests
    
    Client->>API_Gateway: API Request with JWT
    API_Gateway->>Cache: Validate Token (Fast Path)
    
    alt Token in Cache
        Cache-->>API_Gateway: Valid Token Data
    else Token not in Cache
        API_Gateway->>Auth_Service: Validate Token
        Auth_Service-->>API_Gateway: Token Validation Result
        API_Gateway->>Cache: Cache Token Data
    end
    
    API_Gateway->>API_Gateway: Check Permissions
    API_Gateway->>Action_Service: Forward Authorized Request
```

## 4. Security & Anti-fraud Flow (4 Layers)

```mermaid
flowchart TD
    A[Client Request] --> B[Layer 1: Rate Limiting]
    
    B --> C{Check Rate Limits}
    C -->|Global Limit Exceeded| D1[Reject: TOO_MANY_REQUESTS]
    C -->|User Limit Exceeded| D2[Reject: USER_RATE_LIMIT]
    C -->|Action Limit Exceeded| D3[Reject: ACTION_LIMIT]
    C -->|OK| E[Layer 2: Authentication]
    
    E --> F{Verify JWT Token}
    F -->|Invalid/Expired| G1[Reject: INVALID_TOKEN]
    F -->|Valid| H{Check RBAC Permissions}
    
    H -->|No Permission| G2[Reject: FORBIDDEN]
    H -->|Authorized| I[Layer 3: Request Signing]
    
    I --> J{Verify HMAC Signature}
    J -->|Check Timestamp| K{< 60 seconds?}
    K -->|No| G3[Reject: STALE_REQUEST]
    K -->|Yes| L{Check Nonce}
    
    L -->|Already Used| G4[Reject: REPLAY_ATTACK]
    L -->|Unique| M{Verify Signature}
    
    M -->|Invalid| G5[Reject: INVALID_SIGNATURE]
    M -->|Valid| N[Store Nonce in Redis]
    
    N --> O[Layer 4: Zero-Trust Validation]
    
    O --> P[Server Validates Preconditions]
    P --> Q{Action Valid?}
    Q -->|Task Not Found| G6[Reject: TASK_NOT_FOUND]
    Q -->|Unauthorized| G7[Reject: UNAUTHORIZED]
    Q -->|Already Done| G8[Reject: ALREADY_COMPLETED]
    Q -->|Cooldown Active| G9[Reject: COOLDOWN]
    
    Q -->|Valid| R[Server Calculates Score]
    R --> S[Update Database]
    S --> T[Invalidate Cache]
    T --> U[Broadcast Update]
    U --> V[SUCCESS]
    
    D1 --> W[Log Rejection]
    D2 --> W
    D3 --> W
    G1 --> W
    G2 --> W
    G3 --> W
    G4 --> W
    G5 --> W
    G6 --> W
    G7 --> W
    G8 --> W
    G9 --> W
    
    W --> X[END]
    V --> X
    
    style B fill:#ff6b6b
    style E fill:#4ecdc4
    style I fill:#45b7d1
    style O fill:#96ceb4
    style V fill:#95e1d3
```

## 5. WebSocket Connection Management Flow

```mermaid
stateDiagram-v2
    [*] --> Disconnected
    
    Disconnected --> Connecting: Client Connect
    Connecting --> Connected: Handshake Success
    Connecting --> Disconnected: Handshake Failed
    
    Connected --> Authenticating: Send Auth Token
    Authenticating --> Authenticated: Valid Token
    Authenticating --> Disconnected: Invalid Token
    
    Authenticated --> Subscribed: Subscribe to Events
    Subscribed --> Subscribed: Receive Updates
    
    Subscribed --> Authenticated: Unsubscribe
    Authenticated --> Disconnected: Client Disconnect
    Connected --> Disconnected: Connection Lost
    
    state Subscribed {
        [*] --> ScoreboardSub
        [*] --> UserUpdatesSub
        
        ScoreboardSub --> ScoreboardSub: Receive Leaderboard Updates
        UserUpdatesSub --> UserUpdatesSub: Receive Personal Score Updates
    }
```

## 6. Database Transaction Flow for Score Update

```mermaid
sequenceDiagram
    participant Queue
    participant DB
    participant Cache
    participant Metrics

    Queue->>DB: BEGIN TRANSACTION
    
    Queue->>DB: SELECT user FOR UPDATE
    DB-->>Queue: Current User Data
    
    Queue->>Queue: Calculate New Score
    Queue->>Queue: Validate Score Change
    
    Queue->>DB: UPDATE users SET current_score = ?
    Queue->>DB: INSERT INTO score_history
    Queue->>DB: INSERT INTO actions
    
    alt All Operations Success
        Queue->>DB: COMMIT TRANSACTION
        Queue->>Cache: Invalidate User Cache
        Queue->>Cache: Invalidate Scoreboard Cache
        Queue->>Metrics: Record Success Metric
    else Any Operation Failed
        Queue->>DB: ROLLBACK TRANSACTION
        Queue->>Metrics: Record Error Metric
        Queue->>Queue: Retry Logic
    end
```

## 7. Cache Management Strategy Flow

```mermaid
flowchart TD
    A[Data Request] --> B{Check L1 Cache}
    B -->|Hit| C[Return Cached Data]
    B -->|Miss| D{Check L2 Cache - Redis}
    
    D -->|Hit| E[Update L1 Cache]
    E --> F[Return Data]
    D -->|Miss| G[Query Database]
    
    G --> H[Update L2 Cache]
    H --> I[Update L1 Cache]
    I --> J[Return Data]
    
    K[Data Update Event] --> L[Invalidate L1 Cache]
    L --> M[Invalidate L2 Cache]
    M --> N{Refresh Strategy}
    
    N -->|Lazy| O[Wait for Next Request]
    N -->|Eager| P[Preload Cache]
    
    P --> Q[Query Fresh Data]
    Q --> R[Update All Cache Levels]
    
    C --> S[End]
    F --> S
    J --> S
    O --> S
    R --> S
```

## 8. Error Handling and Recovery Flow

```mermaid
flowchart TD
    A[Error Occurred] --> B{Error Type}
    
    B -->|Validation Error| C[Return 400 Bad Request]
    B -->|Authentication Error| D[Return 401 Unauthorized]
    B -->|Authorization Error| E[Return 403 Forbidden]
    B -->|Rate Limit Error| F[Return 429 Too Many Requests]
    B -->|Database Error| G[Database Error Handler]
    B -->|System Error| H[System Error Handler]
    
    G --> I{Transient Error?}
    I -->|Yes| J[Retry with Backoff]
    I -->|No| K[Log Error & Return 500]
    
    J --> L{Retry Successful?}
    L -->|Yes| M[Continue Processing]
    L -->|No| N[Max Retries Reached]
    N --> K
    
    H --> O[Log Critical Error]
    O --> P[Alert Operations Team]
    P --> Q[Graceful Degradation]
    
    C --> R[Log & Return Error Response]
    D --> R
    E --> R
    F --> R
    K --> R
    Q --> R
    
    R --> S[End]
    M --> S
```

## 9. Monitoring and Alerting Flow

```mermaid
sequenceDiagram
    participant App
    participant Metrics
    participant Prometheus
    participant Grafana
    participant AlertManager
    participant PagerDuty

    App->>Metrics: Record Metric (Counter/Gauge/Histogram)
    Metrics->>Prometheus: Scrape Metrics Endpoint
    
    Prometheus->>Prometheus: Evaluate Alert Rules
    
    alt Alert Condition Met
        Prometheus->>AlertManager: Fire Alert
        AlertManager->>AlertManager: Group & Route Alert
        
        alt Critical Alert
            AlertManager->>PagerDuty: Send Immediate Alert
            PagerDuty->>PagerDuty: Page On-call Engineer
        else Warning Alert
            AlertManager->>Grafana: Send Notification
            Grafana->>Grafana: Display Dashboard Alert
        end
    end
    
    Grafana->>Prometheus: Query Metrics for Dashboard
    Prometheus-->>Grafana: Return Time Series Data
    Grafana->>Grafana: Render Dashboard
```

## 10. Deployment and Health Checks Flow

```mermaid
flowchart TD
    A[New Deployment] --> B[Health Check Endpoint]
    B --> C{/health/ready}
    
    C -->|Pass| D[Database Connection Test]
    C -->|Fail| E[Return 503 Service Unavailable]
    
    D -->|Pass| F[Redis Connection Test]
    D -->|Fail| E
    
    F -->|Pass| G[External Dependencies Test]
    F -->|Fail| E
    
    G -->|Pass| H[Return 200 OK]
    G -->|Fail| I[Return 503 Partial Outage]
    
    H --> J[Load Balancer Routes Traffic]
    I --> K[Load Balancer Reduces Traffic]
    E --> L[Load Balancer Stops Traffic]
    
    J --> M[Monitor Application Metrics]
    K --> M
    
    M --> N{Performance Degradation?}
    N -->|Yes| O[Auto-scale Pods]
    N -->|No| P[Continue Normal Operation]
    
    O --> Q[Kubernetes HPA Triggers]
    Q --> R[Scale Up Replicas]
    R --> S[Distribute Load]
    S --> P
```

## Summary of Main Flows

### 1. **Action Processing Flow**
- Client sends action → API Gateway → Authentication → Validation → Queue → Database → Cache Update → WebSocket Broadcast

### 2. **Real-time Updates**
- Score changes → Calculate new rank → Update cache → Broadcast via WebSocket

### 3. **Security & Anti-fraud (4 Layers)**
Defense in Depth with 4 protection layers:
1. **Layer 1 - Rate Limiting**: Multi-tier (Global, User, Action) to prevent spam and DDoS
2. **Layer 2 - Authentication**: JWT verification + RBAC permissions check
3. **Layer 3 - Request Signing**: HMAC signature with timestamp and nonce to prevent replay attacks
4. **Layer 4 - Zero-Trust Validation**: Server validates preconditions and calculates score

**11 rejection points** ensure no request can bypass security:
- Rate limits (3 types)
- Authentication (2 checks: token + permissions)
- Request signing (3 checks: timestamp + nonce + signature)
- Zero-trust validation (4 checks: task exists + authorized + not done + no cooldown)

### 4. **Error Handling**
- Comprehensive error categorization with appropriate HTTP status codes and retry mechanisms

### 5. **Performance Optimization**
- Multi-level caching strategy with intelligent invalidation and refresh policies

---

## 🎯 Key Security Points

**Defense in Depth**: Each request must pass through **4 layers** and **11 validation points**

**Fail Fast**: Reject as early as possible to save resources (Rate limiting → Authentication → Signing → Validation)

**Zero Trust**: Server doesn't trust any data from client, validates and calculates everything

**Comprehensive Logging**: All rejections are logged for analysis and improvement

These diagrams provide a detailed blueprint for the Backend team to implement each component of the system systematically and ensure consistency.
