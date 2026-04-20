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
