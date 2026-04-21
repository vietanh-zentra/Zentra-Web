# Zentra MT5 Data Expansion Plan

> **Mục tiêu:** Kéo TẤT CẢ dữ liệu có thể từ MetaTrader 5 qua Python API → lưu vào MongoDB → hiển thị trên Frontend.

## Hiện trạng — Đang có gì

| Dữ liệu | API Function | Status |
|---|---|---|
| Account Info (balance, equity, leverage) | `mt5.account_info()` | ✅ Done |
| Trade History (closed deals) | `mt5.history_deals_get()` | ✅ Done |
| Open Positions | `mt5.positions_get()` | ✅ Done |
| Daily Summary (win/loss/profit) | Computed from trades | ✅ Done |

---

## Toàn bộ MT5 Python API — Chưa khai thác

Dưới đây là **TẤT CẢ** dữ liệu MT5 Python API cung cấp mà hệ thống hiện **CHƯA** kéo:

### 1. Account Info mở rộng (`mt5.account_info()`)

Hiện chỉ lấy 12 field, nhưng `account_info()` trả về **~40 field**:

| Field | Mô tả | Ý nghĩa |
|---|---|---|
| `profit` | Floating P/L hiện tại | Lãi/lỗ chưa đóng |
| `margin_level` | % Margin Level | Cảnh báo margin call |
| `margin_so_call` | Margin Call level | Ngưỡng cảnh báo |
| `margin_so_so` | Stop Out level | Ngưỡng tự đóng lệnh |
| `margin_initial` | Initial margin | Ký quỹ ban đầu |
| `margin_maintenance` | Maintenance margin | Ký quỹ duy trì |
| `assets` | Tổng tài sản | Bao gồm commission |
| `liabilities` | Nợ | Liability |
| `commission_blocked` | Commission bị chặn | Phi blocked |
| `trade_mode` | Account type | Demo/Contest/Real |
| `limit_orders` | Max pending orders | Giới hạn lệnh chờ |
| `margin_so_mode` | Stop Out mode | Percent/Money |
| `trade_allowed` | Được phép trade? | Boolean |
| `trade_expert` | EA được phép? | Boolean |
| `fifo_close` | FIFO rule | US accounts |

### 2. Symbols / Market Data (`mt5.symbols_get()`, `mt5.symbol_info()`)

**CHƯA khai thác** — Rất quan trọng cho phân tích:

| Field | Mô tả |
|---|---|
| `symbol` | Tên cặp tiền (EURUSD, GBPUSD...) |
| `bid` / `ask` | Giá hiện tại |
| `spread` | Spread (pips) |
| `volume_min` / `volume_max` | Lot size giới hạn |
| `volume_step` | Bước nhảy lot |
| `contract_size` | Kích thước hợp đồng |
| `point` | Giá trị 1 point |
| `digits` | Số thập phân |
| `trade_tick_value` | Giá trị 1 tick |
| `trade_tick_size` | Kích thước 1 tick |
| `swap_long` / `swap_short` | Phí swap |
| `session_open` / `session_close` | Giờ giao dịch |
| `price_change` | % thay đổi trong ngày |
| `volume_real` | Volume thật |

### 3. Historical Price Data (OHLC Bars)

```python
mt5.copy_rates_from(symbol, timeframe, date_from, count)
mt5.copy_rates_range(symbol, timeframe, date_from, date_to)
```

| Field | Mô tả |
|---|---|
| `time` | Thời gian nến |
| `open` / `high` / `low` / `close` | OHLC |
| `tick_volume` | Volume tick |
| `spread` | Spread tại thời điểm |
| `real_volume` | Volume thật |

**Timeframes:** M1, M5, M15, M30, H1, H4, D1, W1, MN1

### 4. Tick Data (Real-time)

```python
mt5.copy_ticks_from(symbol, date_from, count, flags)
mt5.copy_ticks_range(symbol, date_from, date_to, flags)
```

| Field | Mô tả |
|---|---|
| `time` | Timestamp (ms) |
| `bid` / `ask` | Giá realtime |
| `last` | Last price |
| `volume` | Volume |
| `flags` | Tick type |

### 5. Orders (Pending + History)

```python
mt5.orders_get()            # Lệnh chờ đang active
mt5.history_orders_get()    # Lịch sử lệnh đã xử lý
```

| Field | Mô tả |
|---|---|
| `ticket` | Mã lệnh |
| `type` | BUY_LIMIT, SELL_LIMIT, BUY_STOP, SELL_STOP... |
| `price_open` | Giá đặt lệnh |
| `sl` / `tp` | Stop Loss / Take Profit |
| `volume_current` | Volume hiện tại |
| `symbol` | Symbol |
| `state` | Trạng thái lệnh |
| `time_setup` | Thời gian đặt |
| `time_expiration` | Thời gian hết hạn |
| `comment` | Ghi chú |

### 6. Terminal Info

```python
mt5.terminal_info()
```

| Field | Mô tả |
|---|---|
| `connected` | Kết nối internet |
| `trade_allowed` | Quyền trade |
| `ping_last` | Latency (ms) |
| `company` | Tên broker |
| `name` | Tên terminal |
| `build` | Build version |
| `path` | Đường dẫn cài đặt |

### 7. Performance Metrics (cần tính toán từ trades)

Đây là những metrics mà sếp thấy trong screenshot MT5:

| Metric | Công thức | Ý nghĩa |
|---|---|---|
| **Net P/L** | Σ(net_profit) | Tổng lãi/lỗ ròng |
| **Average P/L** | Net P/L / total_trades | Trung bình mỗi lệnh |
| **Win Rate** | win_trades / total_trades × 100 | Tỉ lệ thắng |
| **Sharpe Ratio** | mean(returns) / std(returns) | Risk-adjusted return |
| **Profit Factor** | Σ(wins) / Σ(losses) | Tỉ lệ lãi/lỗ |
| **Recovery Factor** | Net P/L / Max Drawdown | Khả năng phục hồi |
| **Max Drawdown** | Max peak-to-trough | Sụt giảm vốn tối đa |
| **Max Deposit Load** | Max(margin_used / equity) | Tải ký quỹ cao nhất |
| **Trades/Week** | total_trades / weeks | Tần suất giao dịch |
| **Avg Hold Time** | mean(duration_seconds) | Thời gian giữ lệnh TB |
| **Long vs Short** | count_buy / count_sell | Tỉ lệ mua/bán |
| **Best/Worst Trade** | max/min(net_profit) | Lệnh tốt/xấu nhất |
| **Consecutive Wins** | Max streak of wins | Chuỗi thắng dài nhất |
| **Consecutive Losses** | Max streak of losses | Chuỗi thua dài nhất |
| **Average Win** | mean(profits > 0) | TB lệnh thắng |
| **Average Loss** | mean(profits < 0) | TB lệnh thua |
| **Expectancy** | (Win% × AvgWin) - (Loss% × AvgLoss) | Kỳ vọng mỗi lệnh |

---

## Phân công — Hoà vs Dũng

### 🔷 Hoà — Python MT5 Engine (Backend)

| Task | File | Ưu tiên | Chi tiết |
|---|---|---|---|
| **H-NEW-1** | `mt5_connector.py` | 🔴 Cao | Mở rộng `get_account_info()` — trả về TẤT CẢ ~40 fields từ `mt5.account_info()` |
| **H-NEW-2** | `mt5_connector.py` | 🔴 Cao | Thêm `get_symbols_info()` — lấy danh sách symbols + bid/ask/spread/swap |
| **H-NEW-3** | `mt5_connector.py` | 🔴 Cao | Thêm `get_pending_orders()` — lấy lệnh chờ đang active (`mt5.orders_get()`) |
| **H-NEW-4** | `mt5_connector.py` | 🟡 TB | Thêm `get_order_history()` — lịch sử tất cả lệnh (`mt5.history_orders_get()`) |
| **H-NEW-5** | `mt5_connector.py` | 🟡 TB | Thêm `get_price_history()` — OHLC bars (`mt5.copy_rates_range()`) |
| **H-NEW-6** | `mt5_connector.py` | 🟢 Thấp | Thêm `get_tick_data()` — tick data realtime (`mt5.copy_ticks_range()`) |
| **H-NEW-7** | `mt5_connector.py` | 🟡 TB | Thêm `get_terminal_info()` — thông tin terminal + latency |
| **H-NEW-8** | `performance_calculator.py` | 🔴 Cao | **MỚI** — Tính toán Sharpe, Profit Factor, Max Drawdown, Recovery Factor, Expectancy, Win/Loss streaks |
| **H-NEW-9** | `app_v2.py` | 🔴 Cao | Thêm Flask endpoints cho tất cả functions mới |
| **H-NEW-10** | `data_normalizer.py` | 🟡 TB | Mở rộng normalizer cho symbols, orders, OHLC, ticks |

#### Flask Endpoints mới cần thêm:

```
GET  /symbols              → Danh sách symbols + market data
GET  /symbol/:name         → Chi tiết 1 symbol  
GET  /orders/pending       → Lệnh chờ đang active
GET  /orders/history       → Lịch sử lệnh
GET  /price-history        → OHLC bars (?symbol=EURUSD&tf=H1&from=...&to=...)
GET  /ticks                → Tick data (?symbol=EURUSD&from=...&count=100)
GET  /terminal             → Terminal info + latency
GET  /performance          → Tất cả performance metrics (Sharpe, PF, DD...)
GET  /account/full         → Account info đầy đủ (~40 fields)
POST /full-sync-v2         → Sync toàn bộ (account + trades + positions + orders + performance)
```

---

### 🟢 Dũng — Node.js API + Frontend

| Task | File | Ưu tiên | Chi tiết |
|---|---|---|---|
| **D-NEW-1** | `mt5.service.js` | 🔴 Cao | Proxy tất cả endpoints mới từ Python → Node.js |
| **D-NEW-2** | `mt5.controller.js` | 🔴 Cao | Thêm controllers cho symbols, orders, price-history, performance |
| **D-NEW-3** | `mt5.route.js` | 🔴 Cao | Thêm routes: `/v1/mt5/symbols`, `/v1/mt5/orders`, `/v1/mt5/performance`, etc. |
| **D-NEW-4** | MongoDB Models | 🟡 TB | Model mới: `Symbol`, `Order`, `PriceHistory`, `PerformanceSnapshot` |
| **D-NEW-5** | Frontend - Connect | 🟡 TB | Hiện thêm account info đầy đủ (margin level, trade mode, profit...) |
| **D-NEW-6** | Frontend - Dashboard | 🔴 Cao | Widget mới: Performance Metrics (Sharpe, PF, MDD, Recovery Factor) |
| **D-NEW-7** | Frontend - Trades | 🟡 TB | Thêm cột: symbol, volume, open/close price, commission, swap |
| **D-NEW-8** | Frontend - NEW page | 🟡 TB | Trang "Market Watch" — hiện symbols + giá realtime |
| **D-NEW-9** | Frontend - NEW page | 🟢 Thấp | Trang "Price Chart" — hiện OHLC chart từ data kéo về |
| **D-NEW-10** | Frontend - Orders | 🟡 TB | Trang "Orders" — hiện pending orders + order history |

---

## Thứ tự triển khai đề xuất

### Sprint 1 (Ưu tiên cao — 3-5 ngày)

```
Hoà: H-NEW-1 → H-NEW-3 → H-NEW-8 → H-NEW-9
Dũng: D-NEW-1 → D-NEW-3 → D-NEW-6
```

**Deliverables:**
- Account info đầy đủ 40 fields
- Symbols + market data
- Pending orders
- Performance metrics engine (Sharpe, PF, DD...)
- Frontend dashboard hiện performance metrics

### Sprint 2 (Ưu tiên trung bình — 3-5 ngày)

```
Hoà: H-NEW-4 → H-NEW-5 → H-NEW-7 → H-NEW-10
Dũng: D-NEW-4 → D-NEW-5 → D-NEW-7 → D-NEW-8 → D-NEW-10
```

**Deliverables:**
- Order history đầy đủ
- OHLC price data
- Terminal info + latency monitoring
- Market Watch page
- Enhanced trades table

### Sprint 3 (Ưu tiên thấp — 2-3 ngày)

```
Hoà: H-NEW-6
Dũng: D-NEW-9
```

**Deliverables:**
- Tick data streaming
- Price chart visualization

---

## Blockers

> [!IMPORTANT]
> Tất cả function MT5 Python chỉ chạy trên **Windows** với MT5 terminal đang mở. Cần Windows VPS để deploy production.

> [!WARNING]
> `copy_rates_range()` và `copy_ticks_range()` có thể trả về **hàng triệu records**. Cần pagination + caching ở cả Python lẫn Node.js.

> [!CAUTION]
> AWS deployment vẫn blocked bởi IAM permissions. Cần giải quyết trước khi test production.
