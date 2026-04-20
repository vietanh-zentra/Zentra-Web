# Hướng dẫn Tích hợp Python MT5 Service — Dành cho Hoà

> **Mục đích:** Hướng dẫn Hoà cách Python Flask service giao tiếp với Node.js backend qua các API mới.
> **Cập nhật:** 2026-04-20 — Thêm 3 endpoints Hoà phải implement + fix response format.

---

## 1. Luồng Sync Tổng quan

```
Frontend → POST /v1/accounts/:id/sync → Node.js Controller
                                           ↓
                                    SyncLog created (status: in_progress)
                                           ↓ (1)
                                    POST /trades → Python Flask (Hoà)
                                           ↓
                                    Bulk insert trades (skip duplicates)
                                           ↓ (2)
                                    POST /positions → Python Flask (Hoà)
                                           ↓
                                    Upsert open positions
                                           ↓ (3)
                                    POST /account-info → Python Flask (Hoà)
                                           ↓
                                    Update balance / equity / margin
                                           ↓
                                    Recalculate daily summaries
                                           ↓
                                    SyncLog updated (status: success/failed)
```

---

## 2. Endpoints mà Hoà phải implement (Python Flask)

Node.js backend sẽ gọi 4 endpoint trên Flask service của Hoà. **TẤT CẢ đều dùng POST**, kèm header `X-API-Key`.

### 2.1 `POST /connect` — Kết nối MT5
**Request:**
```json
{
  "accountId": 12345678,
  "server": "MetaQuotes-Demo",
  "password": "investor_password",
  "manualLogin": true
}
```
**Success Response:**
```json
{
  "success": true,
  "accountId": 12345678,
  "server": "MetaQuotes-Demo",
  "balance": 10000.00,
  "equity": 10500.00,
  "margin": 0.00,
  "currency": "USD"
}
```

### 2.2 `POST /trades` — Lấy lịch sử giao dịch đã đóng
**Request:**
```json
{
  "accountId": 12345678,
  "server": "MetaQuotes-Demo",
  "password": "investor_password",
  "fromDate": "2026-04-01T00:00:00.000Z",
  "toDate": "2026-04-20T23:59:59.000Z"
}
```
**Success Response:**
```json
{
  "success": true,
  "count": 25,
  "trades": [ ... ]
}
```

### 2.3 `POST /positions` — Lấy vị thế đang mở
**Request:**
```json
{
  "accountId": 12345678,
  "server": "MetaQuotes-Demo",
  "password": "investor_password"
}
```
**Success Response:**
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
      "openTime": "2026-04-19T10:30:00Z",
      "stopLoss": 1.1000,
      "takeProfit": 1.1100,
      "floatingProfit": 25.00,
      "swap": 0.00,
      "magicNumber": 0
    }
  ]
}
```

### 2.4 `POST /account-info` — Lấy thông tin tài khoản
**Request:**
```json
{
  "accountId": 12345678,
  "server": "MetaQuotes-Demo",
  "password": "investor_password"
}
```
**Success Response:**
```json
{
  "success": true,
  "accountInfo": {
    "accountId": 12345678,
    "balance": 10000.00,
    "equity": 10500.00,
    "margin": 250.00,
    "currency": "USD",
    "leverage": 100,
    "company": "MetaQuotes Ltd.",
    "accountName": "Demo Account"
  }
}
```

---

## 3. Error Codes — Python phải dùng

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
  "message": "Login failed: invalid account or password"
}
```

> ⚠️ **QUAN TRỌNG:** Node.js sẽ đọc field `errorCode` (không phải `code` hay `error`). Luôn dùng `errorCode` và `message`.

---

## 4. Trade Object Format (Python gửi về)

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

## 5. Cấu hình Flask (.env)

Hoà cần set biến môi trường cho Flask service:

```env
# Flask
FLASK_PORT=4000
API_KEY=your-secret-api-key-change-in-production

# MT5 Terminal
MT5_TERMINAL_PATH=C:\Program Files\MetaTrader 5\terminal64.exe
```

Node.js backend sẽ gửi header `X-API-Key` — Hoà cần validate header này trùng với `API_KEY`.

---

## 6. File Reference trên GitHub

| File | Link |
|------|------|
| Error Codes | `src/utils/errorCodes.js` |
| MT5 Service (Node gọi Flask) | `src/services/mt5.service.js` |
| Trade Model (xem fields) | `src/models/trade.model.js` |
| Account Model | `src/models/account.model.js` |
| OpenPosition Model | `src/models/openPosition.model.js` |
| API Reference | `API_REFERENCE.md` |

> **Branch:** `feature/database-api`
> **Repo:** https://github.com/vietanh-zentra/Zentra-Web

---

## 7. Checklist cho Hoà

- [ ] Implement `POST /connect` — trả `success`, `balance`, `equity`, `currency`
- [ ] Implement `POST /trades` — trả `success`, `count`, `trades[]`
- [ ] Implement `POST /positions` — trả `success`, `positions[]`
- [ ] Implement `POST /account-info` — trả `success`, `accountInfo{}`
- [ ] Validate header `X-API-Key` trên mọi endpoint
- [ ] Dùng đúng `errorCode` field trong error response (không phải `code`)
- [ ] Trade object format đúng schema Section 4
- [ ] `ticket` field phải unique per trade
- [ ] `session` auto-detect từ entryTime (London: 14:00-22:00 UTC, NY: 17:00-01:00 UTC, Asia: 01:00-09:00 UTC)
- [ ] Test từng endpoint với Postman trước khi ghép
