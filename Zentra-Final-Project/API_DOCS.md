# Zentra MT5 Data Pipeline — API Reference

> **Branch:** `feature/database-api`  
> **Base URL:** `/v1/accounts`  
> **Auth:** All endpoints require `Bearer <JWT>` token

---

## 📋 Table of Contents
- [Account Management](#account-management)
- [Trade Sync](#trade-sync)
- [Trade Queries](#trade-queries)
- [Open Positions](#open-positions)
- [Daily Summary](#daily-summary)
- [Sync Logs](#sync-logs)
- [Error Codes](#error-codes)
- [Data Models](#data-models)

---

## Account Management

### `POST /v1/accounts` — Register MT5 Account

Register a new MT5 account for the authenticated user.

**Request Body:**
```json
{
  "accountId": "12345678",       // Required — MT5 login number
  "brokerServer": "MetaQuotes-Demo", // Required — MT5 broker server
  "company": "MetaQuotes Ltd.",  // Optional
  "accountName": "My Account",  // Optional
  "currency": "USD",            // Optional (default: "USD")
  "leverage": 100,              // Optional
  "balance": 10000,             // Optional (default: 0)
  "equity": 10500               // Optional (default: 0)
}
```

**Response `201`:**
```json
{
  "success": true,
  "account": {
    "id": "661f...",
    "userId": "660a...",
    "accountId": "12345678",
    "brokerServer": "MetaQuotes-Demo",
    "balance": 10000,
    "equity": 10500,
    "currency": "USD",
    "isConnected": false,
    "totalTradesSynced": 0,
    "createdAt": "2026-04-19T..."
  }
}
```

**Errors:** `400` validation | `401` unauthorized | `409` ACCOUNT_ALREADY_EXISTS

---

### `GET /v1/accounts` — List All Accounts

Returns all MT5 accounts belonging to the authenticated user.

**Response `200`:**
```json
{
  "success": true,
  "accounts": [ ... ],
  "total": 2
}
```

---

### `GET /v1/accounts/:accountId` — Get Account Detail

**Response `200`:**
```json
{
  "success": true,
  "account": { ... }
}
```

**Errors:** `404` ACCOUNT_NOT_FOUND

---

### `DELETE /v1/accounts/:accountId` — Delete Account

⚠️ **Cascade delete** — removes ALL related: trades, positions, daily summaries, sync logs.

**Response `200`:**
```json
{
  "success": true,
  "message": "Account and all related data deleted successfully",
  "deleted": {
    "account": 1,
    "trades": 150,
    "positions": 3,
    "summaries": 30,
    "syncLogs": 10
  }
}
```

---

## Trade Sync

### `POST /v1/accounts/:accountId/sync` — Trigger MT5 Sync

Fetches trades from MT5 Python service, inserts new trades (skips duplicates by ticket), and recalculates daily summaries.

**Request Body (all optional):**
```json
{
  "fromDate": "2026-04-01T00:00:00Z",  // Default: last sync or 30 days ago
  "toDate": "2026-04-19T23:59:59Z",    // Default: now
  "syncType": "full"                    // "full" | "incremental"
}
```

**Response `200`:**
```json
{
  "success": true,
  "syncId": "661f...",
  "tradesFetched": 100,
  "tradesInserted": 25,
  "tradesSkipped": 75,
  "totalTimeMs": 3500,
  "syncedAt": "2026-04-19T..."
}
```

**Errors:** `409` SYNC_IN_PROGRESS | `502` MT5_SERVER_UNREACHABLE | `504` MT5_CONNECTION_TIMEOUT

---

## Trade Queries

### `GET /v1/accounts/:accountId/trades` — Get Trades

Paginated list with filters.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `from` | ISO date | — | Filter from date |
| `to` | ISO date | — | Filter to date |
| `symbol` | string | — | Filter by symbol (e.g. `EURUSD`) |
| `tradeType` | `BUY` \| `SELL` | — | Filter by direction |
| `sortBy` | string | `entryTime:desc` | Sort field and order |
| `page` | integer | `1` | Page number |
| `limit` | integer | `50` | Items per page (max 100) |

**Response `200`:**
```json
{
  "success": true,
  "trades": [ ... ],
  "total": 150,
  "page": 1,
  "limit": 50,
  "totalPages": 3
}
```

---

## Open Positions

### `GET /v1/accounts/:accountId/positions` — Get Open Positions

Returns current open positions (refreshed on each sync).

**Response `200`:**
```json
{
  "success": true,
  "positions": [
    {
      "ticket": 5001,
      "symbol": "EURUSD",
      "tradeType": "BUY",
      "volume": 0.1,
      "openPrice": 1.1050,
      "currentPrice": 1.1075,
      "floatingProfit": 25.00,
      "openTime": "2026-04-19T..."
    }
  ],
  "total": 1
}
```

---

## Daily Summary

### `GET /v1/accounts/:accountId/summary` — Get Daily Summaries

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `from` | ISO date | Start date |
| `to` | ISO date | End date |

**Response `200`:**
```json
{
  "success": true,
  "summaries": [
    {
      "date": "2026-04-18T00:00:00Z",
      "totalTrades": 10,
      "winningTrades": 7,
      "losingTrades": 3,
      "breakEvenTrades": 0,
      "netProfit": 250.50,
      "winRate": 70.00,
      "totalVolume": 1.50,
      "largestWin": 80.00,
      "largestLoss": -35.00
    }
  ],
  "total": 1
}
```

---

## Sync Logs

### `GET /v1/accounts/:accountId/sync-logs` — Get Sync History

**Query:** `?limit=20` (default: 20, max: 100)

**Response `200`:**
```json
{
  "success": true,
  "syncLogs": [
    {
      "syncType": "full",
      "status": "success",
      "tradesSynced": 100,
      "newTradesInserted": 25,
      "totalTimeMs": 3500,
      "startedAt": "2026-04-19T10:00:00Z",
      "completedAt": "2026-04-19T10:00:03Z"
    }
  ],
  "total": 1
}
```

---

## Error Codes

All error responses include an optional `errorCode` field:

```json
{
  "code": 404,
  "errorCode": "ACCOUNT_NOT_FOUND",
  "message": "Account not found"
}
```

### API Errors
| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `UNAUTHORIZED` | 401 | Missing/invalid JWT |
| `NOT_FOUND` | 404 | Resource not found |

### Account Errors
| Code | HTTP | Description |
|------|------|-------------|
| `ACCOUNT_NOT_FOUND` | 404 | Account doesn't exist / not owned by user |
| `ACCOUNT_ALREADY_EXISTS` | 409 | Duplicate MT5 account registration |

### Sync Errors
| Code | HTTP | Description |
|------|------|-------------|
| `SYNC_IN_PROGRESS` | 409 | Another sync is already running |
| `SYNC_FAILED` | 500 | Sync operation failed |

### MT5 Errors (from Python service)
| Code | HTTP | Description |
|------|------|-------------|
| `MT5_INVALID_CREDENTIALS` | 401 | Wrong login/password |
| `MT5_SERVER_UNREACHABLE` | 502 | Can't reach broker server |
| `MT5_CONNECTION_TIMEOUT` | 504 | MT5 connection timed out |
| `MT5_NO_TRADE_HISTORY` | 404 | No trades found for date range |
| `MT5_SERVICE_UNAVAILABLE` | 503 | Python Flask service is down |

---

## Data Models

### Account
```
userId          ObjectId    → User
accountId       String      MT5 login number (unique per user)
brokerServer    String      Broker server name
company         String      Broker company
balance         Number      Current balance
equity          Number      Current equity
currency        String      Account currency (default: USD)
leverage        Number      Account leverage
isConnected     Boolean     Connection status
lastSync        Date        Last successful sync time
totalTradesSynced Number    Total trades synced
```

### Trade (extended fields)
```
ticket          Number      MT5 deal ticket (unique per account)
positionId      Number      Links open + close deals
tradeType       String      BUY | SELL
volume          Number      Lot size
openPrice       Number      Entry price
closePrice      Number      Exit price
stopLoss        Number      SL price
takeProfit      Number      TP price
commission      Number      Broker commission
swap            Number      Overnight swap
netProfit       Number      Total profit after fees
accountId       ObjectId    → Account
```

### OpenPosition
```
accountId       ObjectId    → Account
ticket          Number      Position ticket
symbol          String      Trading symbol
tradeType       String      BUY | SELL
volume          Number      Lot size
openPrice       Number      Entry price
currentPrice    Number      Current market price
floatingProfit  Number      Unrealized P/L
```

### DailySummary
```
accountId       ObjectId    → Account
date            Date        Summary date (UTC midnight)
totalTrades     Number      Total closed trades
winningTrades   Number      Profitable trades
losingTrades    Number      Losing trades
netProfit       Number      Total net profit
winRate         Number      Win percentage
```

### SyncLog
```
accountId       ObjectId    → Account
syncType        String      full | incremental
status          String      in_progress | success | failed
tradesSynced    Number      Trades fetched from MT5
newTradesInserted Number    New trades stored
totalTimeMs     Number      Sync duration
errorCode       String      Error code if failed
```

### PerformanceMetrics (NEW)
```
userId          ObjectId    → User
accountId       ObjectId    → Account
totalTrades     Number      Total trades
winRate         Number      Win percentage
netProfitLoss   Number      Net P/L
profitFactor    Number      Σ(wins) / Σ(losses)
sharpeRatio     Number      Risk-adjusted return
maxDrawdown     Number      Peak-to-trough amount
recoveryFactor  Number      Net P/L / Max Drawdown
expectancy      Number      Expected P/L per trade
bySymbol        Mixed       Per-symbol breakdown
```

### PendingOrder (NEW)
```
accountId       ObjectId    → Account
ticket          Number      Order ticket
symbol          String      Trading symbol
typeName        String      BUY_LIMIT | SELL_STOP...
volume          Number      Lot size
priceOpen       Number      Order price
stopLoss        Number      SL price
takeProfit      Number      TP price
timeExpiration  Date        Expiration time
```

### PriceBar (NEW)
```
symbol          String      Trading symbol
timeframe       String      M1|M5|M15|M30|H1|H4|D1|W1|MN1
open/high/low/close Number  OHLC data
tickVolume      Number      Tick volume
TTL: auto-delete after 30 days
```

---

## MT5 Data Expansion Endpoints (D-NEW)

> **Base URL:** `/v1/mt5`
> **Auth:** All endpoints require `Bearer <JWT>` token + MT5 account must be connected

### `GET /v1/mt5/account/full` — Full Account Info (~40 fields)

Returns comprehensive MT5 account info including margin levels, trade mode, permissions.

**Response `200`:**
```json
{
  "success": true,
  "account": {
    "login": 12345678,
    "balance": 10000.00,
    "equity": 10500.00,
    "margin": 250.00,
    "marginLevel": 4200.00,
    "tradeMode": 0,
    "tradeModeDescription": "Demo",
    "tradeAllowed": true,
    "leverage": 100,
    "currency": "USD"
  }
}
```

---

### `GET /v1/mt5/symbols` — List All Symbols

**Query:** `?group=*USD*` (optional filter)

**Response `200`:**
```json
{
  "success": true,
  "symbols": [
    { "symbol": "EURUSD", "bid": 1.1050, "ask": 1.1052, "spread": 2, "volumeMin": 0.01 }
  ],
  "count": 150
}
```

---

### `GET /v1/mt5/symbols/:symbolName` — Symbol Detail

**Response `200`:**
```json
{ "success": true, "symbol": { "symbol": "EURUSD", "bid": 1.1050, ... } }
```

---

### `GET /v1/mt5/orders/pending` — Active Pending Orders

**Response `200`:**
```json
{
  "success": true,
  "orders": [
    { "ticket": 5001, "symbol": "EURUSD", "typeName": "BUY_LIMIT", "volume": 0.1, "priceOpen": 1.1000 }
  ],
  "count": 2
}
```

---

### `GET /v1/mt5/orders/history` — Historical Orders

**Query:** `?from=2026-01-01T00:00:00Z&to=2026-04-21T00:00:00Z`

**Response `200`:**
```json
{ "success": true, "orders": [ ... ], "count": 50 }
```

---

### `GET /v1/mt5/price-history` — OHLC Price Bars

**Query:** `?symbol=EURUSD&timeframe=H1&count=500&from=...&to=...`

**Response `200`:**
```json
{
  "success": true,
  "symbol": "EURUSD",
  "timeframe": "H1",
  "bars": [
    { "time": "2026-04-21T10:00:00Z", "open": 1.1050, "high": 1.1075, "low": 1.1040, "close": 1.1065 }
  ],
  "count": 500
}
```

---

### `GET /v1/mt5/ticks` — Tick Data

**Query:** `?symbol=EURUSD&count=1000`

**Response `200`:**
```json
{ "success": true, "symbol": "EURUSD", "ticks": [ ... ], "count": 1000 }
```

---

### `GET /v1/mt5/terminal` — Terminal Info

**Response `200`:**
```json
{
  "success": true,
  "terminal": {
    "connected": true,
    "tradeAllowed": true,
    "pingLast": 35,
    "company": "MetaQuotes",
    "build": 4230
  }
}
```

---

### `GET /v1/mt5/performance` — Performance Metrics

**Query:** `?from=2026-01-01T00:00:00Z` (optional)

**Response `200`:**
```json
{
  "success": true,
  "performance": {
    "totalTrades": 150,
    "winRate": 65.33,
    "netProfitLoss": 2500.50,
    "profitFactor": 2.15,
    "sharpeRatio": 1.82,
    "maxDrawdown": 450.00,
    "maxDrawdownPercent": 4.5,
    "recoveryFactor": 5.56,
    "expectancy": 16.67,
    "maxWinStreak": 8,
    "maxLossStreak": 3,
    "bySymbol": { "EURUSD": { "count": 80, "netProfit": 1500.00 } }
  },
  "tradesAnalyzed": 150
}
```

---

### `POST /v1/mt5/full-sync-v2` — Comprehensive Sync

Syncs everything in one call: account, trades, positions, orders, performance, terminal.

**Request Body:**
```json
{ "fromDate": "2026-01-01T00:00:00Z" }
```

**Response `200`:**
```json
{
  "success": true,
  "account": { ... },
  "trades": [ ... ],
  "openPositions": [ ... ],
  "pendingOrders": [ ... ],
  "performance": { ... },
  "terminal": { ... },
  "syncTimeMs": 3500,
  "totalTradesFetched": 150
}
```
