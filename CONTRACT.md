# CONTRACT.md — Interface giữa MT5 Engine (Python) và Backend (Node.js)

Tài liệu này đóng vai trò là "Nguồn chân lý" (Source of Truth) dùng để quy định chính xác định dạng dữ liệu (JSON) mà module MT5 của Hoà sẽ đẩy sang hệ thống Backend Service của Dũng.

---

## 1. Nguyên Tắc Định Dạng Chung (Standard Policy)

### 1.1. Timestamp Standard
- Toàn bộ thời gian phải được convert sang chuỗi **ISO 8601 UTC** (VD: `2026-04-17T23:00:00Z`).
- MT5 trả về Unix timestamp (integer seconds) → Hoà convert bằng `datetime.utcfromtimestamp().strftime('%Y-%m-%dT%H:%M:%SZ')`.
- Backend Node.js nhận string ISO → convert thành `new Date(isoString)` để lưu vào MongoDB.

### 1.2. Numeric Precision Policy
| Field type | Precision | Ví dụ |
|------------|-----------|-------|
| Price (open_price, close_price, stop_loss, take_profit) | Giữ nguyên từ MT5 (thường 5 decimal cho forex) | `1.08523` |
| Profit, commission, swap, net_profit | Round 2 decimal | `24.15` |
| Volume | Giữ nguyên từ MT5 (thường 2 decimal) | `0.10` |
| Balance, equity, margin | Round 2 decimal | `10000.00` |
| Percentage (margin_level) | Round 2 decimal | `8354.58` |
| Duration | Integer (seconds) | `15300` |
| Connection time | Integer (milliseconds) | `5947` |

### 1.3. Nullable Policy
- Nếu không có / không tồn tại (VD: Không cài Stop Loss), giá trị phải trả về là `null`, **KHÔNG BAO GIỜ trả `0`**.
- Fields luôn nullable: `stop_loss`, `take_profit`, `comment`, `magic_number`.
- Fields KHÔNG nullable: `ticket`, `symbol`, `trade_type`, `volume`, `open_price`, `close_price`, `open_time`, `close_time`, `profit`, `net_profit`.

---

## 2. Raw MT5 Field Mapping Table

### 2.1. Account Info: MT5 → Contract
| Raw MT5 field (`mt5.account_info()`) | Contract field | Type | Ghi chú |
|--------------------------------------|----------------|------|---------|
| `account_info.login` | `account_id` | int | |
| `account_info.server` | `broker_server` | string | |
| `account_info.company` | `company` | string | |
| `account_info.name` | `name` | string | Có thể không có → default "Demo Account" |
| `account_info.balance` | `balance` | float | |
| `account_info.equity` | `equity` | float | |
| `account_info.margin` | `margin` | float | |
| `account_info.margin_free` | `free_margin` | float | ⚠️ Tên khác: MT5 dùng `margin_free` |
| `account_info.margin_level` | `margin_level` | float | |
| `account_info.currency` | `currency` | string | |
| `account_info.leverage` | `leverage` | int | |
| *(derived)* | `connected` | bool | Luôn `true` nếu lấy được info |
| *(derived)* | `last_sync` | string ISO | Thời điểm gọi sync |

### 2.2. Closed Trade: MT5 Deals → Contract
Đây là phần phức tạp nhất — 1 trade hoàn chỉnh KHÔNG phải là 1 deal, mà là **kết quả ghép 2+ deals** theo `position_id`.

| Raw MT5 field | Contract field | Nguồn | Ghi chú |
|---------------|----------------|-------|---------|
| `open_deal.ticket` | `ticket` | deal IN | Ticket của deal mở |
| `open_deal.order` hoặc `open_deal.ticket` | `order_id` | deal IN | |
| `open_deal.ticket` | `deal_in_id` | deal IN | |
| `close_deal.ticket` | `deal_out_id` | deal OUT (cuối cùng) | |
| `deal.position_id` | `position_id` | cả hai | Key để ghép |
| `deal.symbol` | `symbol` | deal IN | |
| `open_deal.type` | `trade_type` | deal IN | `DEAL_TYPE_BUY` → `"BUY"`, `DEAL_TYPE_SELL` → `"SELL"` |
| `open_deal.volume` | `volume` | deal IN | |
| `open_deal.price` | `open_price` | deal IN | |
| `close_deal.price` | `close_price` | deal OUT (cuối cùng) | |
| `order.price_sl` | `stop_loss` | history_orders_get | Nullable |
| `order.price_tp` | `take_profit` | history_orders_get | Nullable |
| `open_deal.time` | `open_time` | deal IN | Unix → ISO 8601 |
| `close_deal.time` | `close_time` | deal OUT (cuối cùng) | Unix → ISO 8601 |
| `close_deal.profit` | `profit` | Tổng deal OUT profits | Chỉ từ close deals |
| `close_deal.commission + deal.fee` | `commission` | Tổng close deals | |
| `close_deal.swap` | `swap` | Tổng close deals | |
| *(derived)* | `net_profit` | computed | `profit + commission + swap` |
| `open_deal.magic` | `magic_number` | deal IN | |
| `close_deal.comment` | `comment` | deal OUT | |
| *(derived)* | `duration_seconds` | computed | `close_time - open_time` (unix) |

### 2.3. Open Position: MT5 → Contract
| Raw MT5 field (`mt5.positions_get()`) | Contract field | Type | Ghi chú |
|---------------------------------------|----------------|------|---------|
| `position.ticket` | `ticket` | int | |
| `position.symbol` | `symbol` | string | |
| `position.type` | `trade_type` | string | `POSITION_TYPE_BUY` → `"BUY"` |
| `position.volume` | `volume` | float | |
| `position.price_open` | `open_price` | float | ⚠️ Tên khác: MT5 dùng `price_open` |
| `position.price_current` | `current_price` | float | |
| `position.sl` | `stop_loss` | float/null | `0` → `null` |
| `position.tp` | `take_profit` | float/null | `0` → `null` |
| `position.time` | `open_time` | string ISO | Unix → ISO |
| `position.profit` | `floating_profit` | float | |
| *(không có)* | `commission` | float | `0.0` — chưa settle |
| `position.swap` | `swap` | float | |

---

## 3. Trade Lifecycle Mapping (Deal Flow)

```
MT5 Terminal
    │
    ▼
┌─────────────────────────────────────────────┐
│  mt5.history_deals_get(from, to)            │
│  Returns: List of ALL deals (mixed)         │
│                                              │
│  Deal types to keep:                        │
│    DEAL_TYPE_BUY (0)                        │
│    DEAL_TYPE_SELL (1)                       │
│  Discard: DEAL_TYPE_BALANCE,                │
│           DEAL_TYPE_CREDIT, etc.            │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Separate by deal.entry:                    │
│                                              │
│  DEAL_ENTRY_IN (0)  → open_deals[]          │
│  DEAL_ENTRY_OUT (1) → close_deals[]         │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Group by position_id:                      │
│                                              │
│  position_id=123:                           │
│    open_deal  = deal with ENTRY_IN          │
│    close_deals = [deals with ENTRY_OUT]     │
│                                              │
│  ⚠️ 1 position có thể có NHIỀU close deals │
│     (partial close). Lấy deal cuối cùng    │
│     làm main_close_deal.                    │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Filter: Chỉ giữ trades ĐÃ ĐÓNG           │
│  (có cả open_deal VÀ ít nhất 1 close_deal) │
│                                              │
│  Trades chưa đóng → bỏ qua                 │
│  (lấy từ positions_get() thay vì deals)    │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Compute per trade:                         │
│    profit     = SUM(close_deal.profit)      │
│    commission = SUM(close_deal.commission    │
│                   + close_deal.fee)          │
│    swap       = SUM(close_deal.swap)        │
│    net_profit = profit + commission + swap   │
│    duration   = close_time - open_time      │
│                                              │
│  Lookup TP/SL:                              │
│    history_orders_get(ticket=open_deal.order)│
│    → order.price_tp, order.price_sl         │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Output: CONTRACT-compliant JSON            │
│  (See Section 4 for examples)               │
└─────────────────────────────────────────────┘
```

---

## 4. JSON Payload Examples

### 4.1. Account Info
```json
{
  "account_id": 5049421223,
  "broker_server": "MetaQuotes-Demo",
  "company": "MetaQuotes Software Corp.",
  "name": "Demo Account",
  "balance": 10000.00,
  "equity": 10025.50,
  "margin": 120.00,
  "free_margin": 9905.50,
  "margin_level": 8354.58,
  "currency": "USD",
  "leverage": 100,
  "connected": true,
  "last_sync": "2026-04-19T09:00:00Z"
}
```

### 4.2. Closed Trade
```json
{
  "ticket": 123456789,
  "order_id": 987654321,
  "deal_in_id": 111111111,
  "deal_out_id": 222222222,
  "position_id": 333333333,
  "symbol": "EURUSD",
  "trade_type": "BUY",
  "volume": 0.10,
  "open_price": 1.08500,
  "close_price": 1.08750,
  "stop_loss": 1.08200,
  "take_profit": 1.09000,
  "open_time": "2026-04-15T10:30:00Z",
  "close_time": "2026-04-15T14:45:00Z",
  "profit": 25.00,
  "commission": -0.70,
  "swap": -0.15,
  "net_profit": 24.15,
  "magic_number": 0,
  "comment": "",
  "duration_seconds": 15300
}
```

### 4.3. Open Position
```json
{
  "ticket": 123456790,
  "symbol": "GBPUSD",
  "trade_type": "SELL",
  "volume": 0.05,
  "open_price": 1.32100,
  "current_price": 1.32050,
  "stop_loss": 1.32500,
  "take_profit": 1.31500,
  "open_time": "2026-04-17T08:00:00Z",
  "floating_profit": 2.50,
  "commission": 0.0,
  "swap": 0.00
}
```

### 4.4. Daily Summary
```json
{
  "total_trades": 15,
  "winning_trades": 9,
  "losing_trades": 6,
  "total_profit": 150.00,
  "total_commission": -10.50,
  "total_swap": -2.30,
  "net_profit": 137.20
}
```

---

## 5. Error Codes (Dùng chung Python ↔ Node.js)

| Error Code | HTTP Status | Mô Tả | Nguồn |
|------------|-------------|--------|-------|
| `INVALID_CREDENTIALS` | 401 | Sai Login/Password/Server | `mt5_connector.py` |
| `SERVER_UNREACHABLE` | 503 | Không ping được tới Broker server | `mt5_connector.py` |
| `CONNECTION_TIMEOUT` | 408 | Đợi hơn 30s không kết nối được | `mt5_connector.py` |
| `MT5_NOT_INITIALIZED` | 500 | `mt5.initialize()` fail — lỗi OS/path | `mt5_connector.py` |
| `PERMISSION_DENIED` | 403 | Investor password không đủ quyền | `mt5_connector.py` |
| `NO_TRADE_HISTORY` | 404 | Không có deal nào trong khoảng thời gian | `data_normalizer.py` |
| `SYSTEM_ERROR` | 500 | Exception không lường trước | `app.py` |

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "MT5 login failed: invalid account or password"
  }
}
```
