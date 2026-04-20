# REVIEW REPORT — Hoà Review Code Dũng (Phase H6)

**Date:** 2026-04-20
**Reviewer:** Hoà (MT5 Engine Lead & Integration Owner)
**Branch:** `feature/database-api`
**Commits reviewed:** D1 → D7 (7 commits, +2920 lines)

---

## 1. Tổng Quan: Dũng Đã Hoàn Thành D1-D7

| Phase | Files | Verdict |
|-------|-------|---------|
| D1 — Audit | `ARCHITECTURE_AUDIT.md` | ✅ PASS |
| D2 — Models | `account`, `openPosition`, `dailySummary`, `syncLog`, extended `trade` | ✅ PASS (có issues nhỏ) |
| D3 — Services | `account`, `sync`, `openPosition`, `dailySummary`, extended `trade` | ✅ PASS |
| D4 — API | `account.controller.js`, `account.route.js`, `account.validation.js` | ✅ PASS |
| D5 — Error codes | `errorCodes.js` | ✅ PASS |
| D6 — Tests | Unit (account model, error codes) + Integration (9 endpoints) | ✅ PASS |
| D7 — Docs | `API_REFERENCE.md`, `INTEGRATION_GUIDE.md`, `CHANGELOG.md` | ✅ PASS |

---

## 2. Issues Phát Hiện — CẦN SỬA TRƯỚC KHI GHÉP

### ISSUE #1: Field Naming Mismatch (CRITICAL)
Python CONTRACT.md dùng **snake_case**, nhưng Backend Mongoose model dùng **camelCase**.

| Python (CONTRACT.md) | Backend (trade.model.js) | Cần transform |
|---|---|---|
| `open_time` | `entryTime` | ✅ Tên khác hoàn toàn |
| `close_time` | `exitTime` | ✅ Tên khác hoàn toàn |
| `trade_type` | `tradeType` | ✅ |
| `open_price` | `openPrice` | ✅ |
| `close_price` | `closePrice` | ✅ |
| `stop_loss` | `stopLoss` | ✅ |
| `take_profit` | `takeProfit` | ✅ |
| `net_profit` | `netProfit` | ✅ |
| `magic_number` | `magicNumber` | ✅ |
| `duration_seconds` | `durationSeconds` | ✅ |
| `deal_in_id` | `dealInId` | ✅ |
| `deal_out_id` | `dealOutId` | ✅ |
| `position_id` | `positionId` | ✅ |
| `order_id` | `orderId` | ✅ |
| `profit` | `profitLoss` | ✅ Tên khác |
| `symbol` | `mt5Symbol` | ✅ Cần thêm field |

**Resolution:** Hoà sẽ viết adapter trong Flask `app.py` để transform output.

### ISSUE #2: Backend Yêu Cầu Fields Mà Python Chưa Tính
Backend `trade.model.js` yêu cầu các fields bổ sung:
- `session` — LONDON / NY / ASIA (derive từ entryTime UTC)
- `stopLossHit` — boolean (derive từ close_price vs stop_loss)
- `exitedEarly` — boolean
- `mt5DealId` — duplicate of dealOutId
- `mt5Symbol` — duplicate of symbol

**Resolution:** Hoà thêm logic detect session + stopLossHit vào normalizer.

### ISSUE #3: Error Codes Prefix
- Python hiện tại: `INVALID_CREDENTIALS`
- Backend yêu cầu: `MT5_INVALID_CREDENTIALS` (có prefix `MT5_`)

**Resolution:** Hoà update toàn bộ error codes trong connector để thêm prefix `MT5_`.

### ISSUE #4: Error Response Format
- Python hiện tại: `{"connected": false, "error": {"code": "...", "message": "..."}}`
- Backend INTEGRATION_GUIDE yêu cầu: `{"success": false, "errorCode": "MT5_...", "message": "..."}`

**Resolution:** Hoà update Flask endpoints để match format.

---

## 3. Đánh Giá Chi Tiết Code Quality

### Models — ĐẠT
- Account model có compound unique index ✅
- Trade model có unique sparse index trên `accountId + ticket` ✅ (chống duplicate)
- SyncLog có index cho `in_progress` status ✅ (chống double sync)

### Services — ĐẠT
- `createBulkTradesForAccount()` check duplicate bằng ticket trước khi insert ✅
- `syncService` có anti-double-sync mechanism ✅
- Logger dùng đúng Winston format ✅

### API Endpoints — ĐẠT (9/9 endpoints theo spec)
1. `POST /accounts` ✅
2. `GET /accounts` ✅
3. `GET /accounts/:id` ✅
4. `DELETE /accounts/:id` ✅
5. `POST /accounts/:id/sync` ✅
6. `GET /accounts/:id/trades` ✅
7. `GET /accounts/:id/positions` ✅
8. `GET /accounts/:id/summary` ✅
9. `GET /accounts/:id/sync-logs` ✅

### Tests — ĐẠT
- Unit tests: account model, error codes
- Integration tests: 9 account endpoints
- Dùng Jest + Supertest ✅

---

## 4. Verdict

**APPROVED với điều kiện:** Hoà sẽ tự viết adapter layer trong Python Flask để giải quyết 4 issues trên. Không yêu cầu Dũng sửa (vì code Dũng đúng convention JavaScript camelCase).
