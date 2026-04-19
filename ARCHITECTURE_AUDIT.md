# ARCHITECTURE AUDIT — Zentra Backend

**Date:** 2026-04-19  
**Audited by:** Nguyễn Mạnh Dũng  
**Purpose:** Determine the existing tech stack, database, models, services, and API structure to decide how to extend (not replace) the backend for MT5 data pipeline integration.

---

## 1. Tech Stack Summary

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| **Runtime** | Node.js | >= 12.0.0 | `package.json` engines |
| **Framework** | Express.js | ^4.17.1 | REST API server |
| **Database** | MongoDB | Remote (Atlas/cloud) | Connected via `MONGODB_URL` env var |
| **ORM** | Mongoose | ^5.7.7 | Schema-based ODM with plugins |
| **Auth** | Passport.js + JWT | ^0.4.0 / ^4.0.0 | Access + Refresh tokens |
| **OAuth** | Google OAuth 2.0 | passport-google-oauth20 | Optional sign-in method |
| **Validation** | Joi | ^17.3.0 | Request validation middleware |
| **Logging** | Winston | ^3.2.1 | Console + file transport |
| **HTTP Logging** | Morgan | ^1.9.1 | Request logging |
| **Security** | Helmet + XSS-Clean + Mongo-Sanitize | Various | Standard Express security |
| **Rate Limiting** | express-rate-limit | ^5.0.0 | Auth endpoints only |
| **Email** | Nodemailer | ^6.3.1 | SMTP-based email sending |
| **Encryption** | AES-256-GCM | Custom (`utils/encryption.js`) | MT5 password encryption |
| **Testing** | Jest + Supertest | ^26.0.1 / ^6.0.1 | Unit + integration tests |
| **Process Manager** | PM2 | ^5.1.0 | Production process management |
| **Containerization** | Docker + docker-compose | Existing | Multiple compose files (dev/prod/test) |
| **Deployment** | Vercel | `vercel.json` configured | Serverless Node.js deployment |
| **API Documentation** | Swagger (swagger-jsdoc + swagger-ui-express) | ^6.0.8 | Auto-generated docs at `/docs` |

---

## 2. Project Structure

```
src/
├── app.js                    # Express app setup (middleware, routes, error handling)
├── index.js                  # Server entry point (MongoDB connect + listen)
├── config/
│   ├── config.js             # Environment config with Joi validation
│   ├── logger.js             # Winston logger setup
│   ├── morgan.js             # Morgan HTTP logger
│   ├── passport.js           # JWT + Google OAuth strategies
│   ├── roles.js              # User roles (user, admin)
│   └── tokens.js             # Token types (access, refresh, resetPassword, verifyEmail)
├── controllers/
│   ├── index.js              # Controller exports
│   ├── auth.controller.js    # Login, register, logout, refresh, password reset
│   ├── user.controller.js    # User CRUD
│   ├── trade.controller.js   # Trade CRUD
│   ├── mt5.controller.js     # MT5 connect, sync, disconnect, status
│   ├── dashboard.controller.js
│   ├── analysis.controller.js
│   ├── health.controller.js  # Health check + DB/MT5 status
│   ├── tradingPlan.controller.js
│   └── zentra.controller.js  # Analytics v2 (mental battery, radar, heatmap...)
├── models/
│   ├── index.js              # Model exports
│   ├── user.model.js         # User schema (includes mt5Account embedded)
│   ├── trade.model.js        # Trade schema (psychology-focused)
│   ├── dashboard.model.js    # Dashboard aggregation
│   ├── stateAnalysis.model.js
│   ├── sessionForecast.model.js
│   ├── performanceSnapshot.model.js
│   ├── behaviorHeatmapHistory.model.js
│   ├── stabilityTrendHistory.model.js
│   ├── tradingPlan.model.js
│   ├── token.model.js
│   └── enums.js              # TradingSessions, PsychologicalState enums
├── routes/
│   ├── v1/                   # V1 API routes (CRUD, auth, mt5, trades, dashboard, health)
│   │   ├── index.js          # Route registration
│   │   ├── auth.route.js
│   │   ├── user.route.js
│   │   ├── trade.route.js
│   │   ├── mt5.route.js      # MT5 connect/sync/disconnect/status
│   │   ├── dashboard.route.js
│   │   ├── analysis.route.js
│   │   ├── health.route.js
│   │   ├── tradingPlan.route.js
│   │   └── docs.route.js
│   └── v2/                   # V2 API routes (Zentra analytics)
│       ├── index.js
│       ├── zentra.route.js   # Mental battery, radar, heatmap, trend, quote
│       └── docs.route.js
├── services/
│   ├── index.js              # Service exports
│   ├── auth.service.js
│   ├── user.service.js
│   ├── trade.service.js      # Trade CRUD + bulk + history analysis
│   ├── mt5.service.js        # HTTP calls to Python Flask MT5 service
│   ├── dashboard.service.js
│   ├── analysis.service.js
│   ├── zentra.service.js     # Analytics calculations
│   ├── tradingPlan.service.js
│   ├── email.service.js
│   ├── token.service.js
│   ├── analysis/             # Sub-modules for analysis
│   ├── dashboard/            # Sub-modules for dashboard
│   └── zentra/               # Sub-modules for zentra analytics
├── middlewares/
│   ├── auth.js               # JWT authentication middleware
│   ├── error.js              # Error converter + handler
│   ├── validate.js           # Joi validation middleware
│   ├── rateLimiter.js        # Rate limiting
│   └── requireTradingPlan.js # Middleware requiring trading plan
├── validations/
│   ├── index.js
│   ├── auth.validation.js
│   ├── user.validation.js
│   ├── trade.validation.js
│   ├── mt5.validation.js
│   ├── dashboard.validation.js
│   ├── analysis.validation.js
│   ├── tradingPlan.validation.js
│   ├── zentra.validation.js
│   └── custom.validation.js
└── utils/
    ├── ApiError.js            # Custom error class (statusCode, message, isOperational)
    ├── catchAsync.js          # Async error wrapper for controllers
    ├── pick.js                # Object property picker
    ├── encryption.js          # AES-256-GCM encrypt/decrypt (for MT5 passwords)
    ├── dateRange.js           # Date range utilities
    ├── computeMedian.js       # Statistical median calculation
    └── stateTrigger.js        # Psychological state triggers
```

---

## 3. Database — MongoDB (Mongoose)

### Connection
- **File:** `src/index.js`
- **Method:** `mongoose.connect(config.mongoose.url, options)`
- **URL:** From `MONGODB_URL` environment variable
- **Options:** `serverSelectionTimeoutMS: 10000`, `socketTimeoutMS: 45000`

### Existing Models

| Model | Collections | Key Fields | Indexes |
|-------|------------|------------|---------|
| **User** | `users` | name, email, password, googleId, role, mt5Account (embedded: accountId, server, password, isConnected, lastSyncAt) | email (unique), googleId (sparse unique) |
| **Trade** | `trades` | userId, entryTime, exitTime, profitLoss, session, stopLossHit, exitedEarly, riskPercentUsed, riskRewardAchieved, targetPercentAchieved, notes, mt5DealId, mt5Symbol, source (type + mt5AccountId) | userId+entryTime, session+entryTime, source.mt5AccountId |
| **TradingPlan** | `tradingplans` | userId, rules, maxDailyTrades, riskPercent, sessions | userId |
| **Dashboard** | `dashboards` | userId, brainHero (state + stateAnalysis ref), sessionForecast, performanceSnapshot, recentTrades, tradingPlan | userId |
| **StateAnalysis** | `stateanalyses` | userId, state, confidence, indicators[], analyzedTradeCount, dateRange, timestamp | userId+timestamp, state+timestamp |
| **SessionForecast** | `sessionforecasts` | userId, session forecast data | userId |
| **PerformanceSnapshot** | `performancesnapshots` | userId, performance metrics | userId |
| **BehaviorHeatmapHistory** | `behaviorheatmaphistories` | userId, date, windows, insight, totalTrades | userId+date |
| **StabilityTrendHistory** | `stabilitytrendhistories` | userId, date, score, metrics, tradeCount | userId+date |
| **Token** | `tokens` | token, user, type, expires, blacklisted | — |

### Migration System
- **None** — Mongoose auto-syncs schema changes. No migration tool (Alembic, Knex, etc.).

---

## 4. MT5 Integration — Current Architecture

```
┌─────────────────────────────────┐
│  Frontend (Next.js)             │
│  POST /v1/mt5/connect           │
│  POST /v1/mt5/sync              │
└──────────┬──────────────────────┘
           │ JWT Auth
           ▼
┌─────────────────────────────────┐
│  Node.js Backend (Express)      │
│  mt5.controller.js              │
│    → mt5.service.js             │
│      → HTTP call to Python      │
└──────────┬──────────────────────┘
           │ HTTP + API Key
           ▼
┌─────────────────────────────────┐
│  Python Flask Service           │
│  (mt5-connector-main/app.py)    │
│  Port: 5000 (configurable)      │
│  Endpoints: /connect, /trades   │
│  Uses: MetaTrader5 Python lib   │
└─────────────────────────────────┘
```

### How it works:
1. Frontend calls `POST /v1/mt5/connect` with `{ accountId, server, password }`
2. `mt5.controller.js` encrypts password (AES-256-GCM) and stores in `User.mt5Account`
3. `mt5.service.js` calls Python Flask `POST /connect` with credentials + API key
4. Python Flask uses `MetaTrader5` library to connect and return account info
5. For sync: `mt5.service.js` calls `POST /trades` → Python returns trade data → `trade.service.createBulkTrades()` saves to MongoDB

### Config:
```
MT5_API_URL = http://localhost:4000  (Python Flask service URL)
MT5_API_KEY = your-secret-api-key    (shared API key for auth)
MT5_ENCRYPTION_KEY = ...             (AES key for MT5 passwords, defaults to JWT_SECRET)
```

---

## 5. Auth Flow

1. **Register:** `POST /v1/auth/register` → Create user + send verify email
2. **Login:** `POST /v1/auth/login` → Return access + refresh tokens (JWT)
3. **Google OAuth:** `GET /v1/auth/google` → Passport Google strategy → JWT tokens
4. **Token refresh:** `POST /v1/auth/refresh-tokens` → New access token
5. **Route protection:** `auth()` middleware in routes → Passport JWT strategy
6. **Tokens stored:** Client-side (localStorage: accessToken, refreshToken)

---

## 6. What ALREADY EXISTS (Can Reuse)

| Component | File | Status |
|-----------|------|--------|
| Trade CRUD + bulk insert | `trade.service.js` | ✅ Reusable — need to extend for new fields |
| MT5 connect/sync/disconnect | `mt5.controller.js` + `mt5.service.js` | ✅ Fully working |
| Error handling | `ApiError.js` + `error.js` middleware | ✅ Reusable — need to add error codes |
| Winston logger | `config/logger.js` | ✅ Fully working |
| Joi validation | `validations/*.validation.js` | ✅ Pattern to follow |
| JWT auth middleware | `middlewares/auth.js` | ✅ Fully working |
| Docker setup | `Dockerfile` + `docker-compose.yml` | ✅ Exists |
| Swagger docs | `swagger-jsdoc` + `swagger-ui-express` | ✅ Available at `/docs` |

---

## 7. What NEEDS TO BE CREATED

| Component | Type | Reason |
|-----------|------|--------|
| `account.model.js` | New Model | Separate Account collection (currently mt5Account is embedded in User) |
| `openPosition.model.js` | New Model | No model for open positions currently |
| `dailySummary.model.js` | New Model | No daily aggregation model |
| `syncLog.model.js` | New Model | No sync history tracking |
| `account.service.js` | New Service | CRUD for MT5 accounts |
| `sync.service.js` | New Service | Sync log management |
| `openPosition.service.js` | New Service | Open position management |
| `dailySummary.service.js` | New Service | Daily summary calculation |
| `account.controller.js` | New Controller | API handlers for /accounts endpoints |
| `account.route.js` | New Route | /v1/accounts/* routing |
| `account.validation.js` | New Validation | Joi schemas for account endpoints |
| `errorCodes.js` | New Utility | Standardized error codes (shared with Hoà) |

---

## 8. What NEEDS TO BE EXTENDED

| Component | File | Changes Needed |
|-----------|------|---------------|
| **Trade Model** | `trade.model.js` | Add ~15 MT5 raw data fields (ticket, volume, openPrice, closePrice, SL, TP, commission, swap, netProfit, dealInId, dealOutId, positionId, tradeType, magicNumber, durationSeconds) |
| **Trade Service** | `trade.service.js` | Add `getTradeByTicket()`, `getTradesByAccount()`, `calculateDailySummary()`, update `createBulkTrades()` for new fields |
| **ApiError** | `utils/ApiError.js` | Add `code` parameter for error code strings |
| **Error Middleware** | `middlewares/error.js` | Include `code` field in error response JSON |
| **Models Index** | `models/index.js` | Export new models |
| **Services Index** | `services/index.js` | Export new services |
| **Routes Index** | `routes/v1/index.js` | Register new account routes |

---

## 9. Decision: Extend vs Replace

### ✅ DECISION: EXTEND the existing codebase

**Reasons:**
1. Backend is **fully functional** and running in production (Vercel)
2. Frontend is already calling v1/v2 endpoints — changing would break it
3. MongoDB is sufficient for this use case — no need to switch to PostgreSQL
4. Mongoose schemas can be extended without migrations
5. Code quality is good — proper separation of concerns, logging, error handling
6. MT5 integration flow is already established (Node.js ↔ Python Flask)

**What will NOT change:**
- Database engine (MongoDB stays)
- Backend framework (Express stays)
- Auth system (JWT + Passport stays)
- Existing routes (v1 + v2 untouched)
- Existing models (no field removal)
- Deployment method (Vercel compatible)

---

## 10. Risks and Notes

1. **Mongoose Decimal128 vs Number:** For financial precision, consider `mongoose.Types.Decimal128` for price/profit fields. However, current Trade model uses `Number` — maintain consistency unless precision issues arise.

2. **No migration tool:** Schema changes are automatically reflected by Mongoose. Old documents without new fields will have `null`/`undefined` — ensure all new fields have proper defaults.

3. **MT5 Python service dependency:** The Node.js backend cannot directly connect to MT5. All MT5 operations go through the Python Flask service. This is already working and should not change.

4. **Vercel cold starts:** Vercel serverless functions have cold start times. MongoDB connections are re-established on each cold start. The existing code handles this with proper timeout/retry settings.

5. **Branch strategy:** Work on `feature/database-api` branch. Push daily. Hoà will review before merging to `main`.
