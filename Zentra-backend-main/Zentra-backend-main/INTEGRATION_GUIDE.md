# Hướng dẫn Tích hợp Python MT5 Service — Dành cho Hoà

> **Mục đích:** Hướng dẫn Hoà cách Python Flask service giao tiếp với Node.js backend qua các API mới.

---

## 1. Luồng Sync Tổng quan

```
Frontend → POST /v1/accounts/:id/sync → Node.js Controller
                                           ↓
                                    SyncLog created (status: in_progress)
                                           ↓
                                    → Python Flask Service (Hoà)
                                           ↓
                                    Fetch trades from MT5 terminal
                                           ↓
                                    Return JSON → Node.js
                                           ↓
                                    Bulk insert trades (skip duplicates)
                                           ↓
                                    Recalculate daily summaries
                                           ↓
                                    SyncLog updated (status: success/failed)
```

---

## 2. Error Codes — Python phải dùng

Khi Python Flask service trả về lỗi, **PHẢI** dùng đúng error codes trong response:

```python
# Python — Map error codes cho MT5
ERROR_CODES = {
    "MT5_INVALID_CREDENTIALS": 401,
    "MT5_SERVER_UNREACHABLE": 502,
    "MT5_CONNECTION_TIMEOUT": 504,
    "MT5_NOT_INITIALIZED": 500,
    "MT5_NO_TRADE_HISTORY": 404,
    "MT5_PERMISSION_DENIED": 403,
    "MT5_TERMINAL_NOT_FOUND": 500,
    "MT5_ACCOUNT_MISMATCH": 409,
    "MT5_DATA_FETCH_FAILED": 502,
    "MT5_SERVICE_UNAVAILABLE": 503,
}
```

### Error Response Format (Python → Node.js):
```json
{
  "success": false,
  "errorCode": "MT5_INVALID_CREDENTIALS",
  "message": "Login failed: invalid account or password",
  "statusCode": 401
}
```

### Success Response Format (Python → Node.js):
```json
{
  "success": true,
  "trades": [ ... ],
  "accountInfo": {
    "accountId": 12345678,
    "server": "MetaQuotes-Demo",
    "balance": 10000.00,
    "equity": 10500.00,
    "currency": "USD"
  }
}
```

---

## 3. Trade Object Format (Python gửi về)

Mỗi trade object trong array `trades` phải có format sau:

```json
{
  "ticket": 123456789,
  "orderId": 123456788,
  "dealInId": 100001,
  "dealOutId": 100002,
  "positionId": 123456789,
  "mt5Symbol": "EURUSD",
  "mt5DealId": 100002,
  "tradeType": "BUY",
  "volume": 0.10,
  "openPrice": 1.10500,
  "closePrice": 1.10750,
  "stopLoss": 1.10000,
  "takeProfit": 1.11000,
  "entryTime": "2026-04-18T10:30:00Z",
  "exitTime": "2026-04-18T14:45:00Z",
  "profitLoss": 25.00,
  "commission": -0.70,
  "swap": 0.00,
  "netProfit": 24.30,
  "magicNumber": 0,
  "durationSeconds": 15300,
  "session": "LONDON",
  "stopLossHit": false,
  "exitedEarly": false,
  "riskPercentUsed": null,
  "riskRewardAchieved": null,
  "targetPercentAchieved": null,
  "notes": ""
}
```

### Quy tắc:
- `ticket` **BẮT BUỘC** — dùng để chống duplicate
- `tradeType` chỉ nhận `"BUY"` hoặc `"SELL"`
- `session` chỉ nhận `"LONDON"`, `"NY"`, `"ASIA"`
- Dates phải ở format **ISO 8601** (UTC)
- `commission` và `swap` thường là **số âm**
- `netProfit = profitLoss + commission + swap`

---

## 4. File Reference trên GitHub

| File | Link |
|------|------|
| Error Codes | `src/utils/errorCodes.js` |
| Trade Model (xem fields) | `src/models/trade.model.js` |
| Account Model | `src/models/account.model.js` |
| API Reference | `API_REFERENCE.md` |

> **Branch:** `feature/database-api`
> **Repo:** https://github.com/vietanh-zentra/Zentra-Web

---

## 5. Checklist cho Hoà

- [ ] Đọc file `errorCodes.js` — copy ERROR_CODES vào Python
- [ ] Response format đúng JSON (success, errorCode, message)
- [ ] Trade object format đúng schema bên trên
- [ ] `ticket` field phải unique per trade
- [ ] `session` auto-detect từ entryTime (London: 14:00-22:00 UTC, NY: 17:00-01:00 UTC, Asia: 01:00-09:00 UTC)
- [ ] Test endpoint với Postman trước khi ghép
