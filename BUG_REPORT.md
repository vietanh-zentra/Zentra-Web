# 🔧 BÁO CÁO LỖI & VIỆC CẦN SỬA — Zentra Web

> **Ngày:** 2026-04-22  
> **Tester:** Dũng (Backend Lead)  
> **URL test:** https://zentra-web-indol.vercel.app/  
> **Branch:** `feature/database-api`

---

## 🔴 CRITICAL — Phải sửa ngay

### BUG-001: Backend không accessible — Ngrok tunnel đã chết

| Mục | Chi tiết |
|-----|---------|
| **File** | `hamail-frontEnd-main/hamail-frontEnd-main/src/utils/api.js` (line 3) |
| **Hiện tại** | `API_BASE_URL = "https://brooklynn-unabdicative-ungenuinely.ngrok-free.dev/v1"` |
| **Vấn đề** | Ngrok tunnel miễn phí, tạm thời — chết khi Hoà tắt máy → TẤT CẢ API FAIL |
| **Ảnh hưởng** | Dashboard, Trades, Trading Plan, MT5 Connect → đều không load data |
| **Fix** | Deploy backend lên cloud (AWS/Railway/Render) hoặc tạo ngrok tunnel mới |
| **Ai sửa** | **Sếp quyết** — cần production backend URL |

**Giải pháp đề xuất:**
```
Option A: AWS EC2 (đã có account) → deploy Node.js + MongoDB
Option B: Railway.app (free tier) → nhanh nhất, auto-deploy
Option C: Render.com (free tier) → có MongoDB built-in
Option D: Ngrok mới (tạm thời) → chỉ dùng khi dev/demo
```

---

### BUG-002: Route `/dashboard/profile` → 404

| Mục | Chi tiết |
|-----|---------|
| **URL** | https://zentra-web-indol.vercel.app/dashboard/profile |
| **Vấn đề** | Nút "Dashboard →" trên homepage dẫn tới route không tồn tại |
| **File** | Frontend — cần kiểm tra routing config |
| **Fix** | Đổi link tới `/dashboard` hoặc tạo page `dashboard/profile` |
| **Ai sửa** | **Frontend team** |

---

## 🟡 HIGH — Sửa sớm

### BUG-003: Trading Plan — Save không hoạt động

| Mục | Chi tiết |
|-----|---------|
| **URL** | https://zentra-web-indol.vercel.app/dashboard?tab=trading |
| **Vấn đề** | Nhấn "Save Changes" → fail vì backend unreachable |
| **Toast** | "Failed to load trading plan. Please try again." |
| **Fix** | Sẽ tự fix khi BUG-001 resolved |
| **Ai sửa** | Tự fix khi backend online |

---

### BUG-004: Trading Plan — Session checkboxes không toggle

| Mục | Chi tiết |
|-----|---------|
| **URL** | https://zentra-web-indol.vercel.app/dashboard?tab=trading |
| **Vấn đề** | Click checkbox London/NY/Asia không toggle đúng |
| **Có thể do** | React state management issue (onClick handler hoặc controlled/uncontrolled mix) |
| **Fix** | Kiểm tra `onChange` handler của session checkboxes trong TradingPlan component |
| **Ai sửa** | **Frontend team** |

---

### BUG-005: Flask `/account-info` và `/positions` — HTTP method conflict

| Mục | Chi tiết |
|-----|---------|
| **File Python** | `mt5_engine/app_v2.py` |
| **Vấn đề** | `/account-info` là GET nhưng không nhận credentials trong body → nếu Flask connected khác account thì trả info sai |
| **Status** | Hoà đã fix bằng cách đổi Node.js sang GET (commit `f6b9128`) |
| **Rủi ro** | Multi-user sẽ gặp vấn đề vì Flask chỉ giữ 1 connection |
| **Fix lâu dài** | Đổi Flask endpoints sang POST, nhận credentials per-request |
| **Ai sửa** | **Hoà** |

---

### BUG-006: Flask `/account-info` response format mismatch

| Mục | Chi tiết |
|-----|---------|
| **File** | `mt5_engine/app_v2.py` line ~341 |
| **Vấn đề** | Flask trả flat JSON `{ success, balance, equity }` nhưng Node.js ban đầu expect `{ accountInfo: {...} }` wrapper |
| **Status** | Hoà đã fix Node.js side (bỏ `.accountInfo` wrapper) |
| **Rủi ro** | Nếu ai đó đổi Flask response lại thì sẽ break |
| **Fix** | Cần document rõ contract trong INTEGRATION_GUIDE.md |
| **Ai sửa** | **Dũng** — update docs |

---

## 🟢 MEDIUM — Sửa khi có thời gian

### BUG-007: Missing pages (404)

| Route | Status |
|-------|--------|
| `/dashboard/profile` | ❌ 404 |
| `/dashboard/settings` | ❌ 404 |
| `/dashboard/analytics` | ❌ 404 |

**Fix:** Tạo pages hoặc redirect tới trang chính  
**Ai sửa:** **Frontend team**

---

### BUG-008: Dashboard widgets — "No data available"

| Widget | Status |
|--------|--------|
| Mental Battery | `---%` — No data |
| Plan Control | `0%` — No data |
| Psychological Traits | All 0% |
| Behaviour Heatmap | "No data available for this date" |

**Nguyên nhân:** Backend unreachable (BUG-001)  
**Fix:** Tự fix khi backend online + có trade data

---

### BUG-009: Supabase config crash

| Mục | Chi tiết |
|-----|---------|
| **File** | `hamail-frontEnd-main/hamail-frontEnd-main/src/config/supabase.js` |
| **Vấn đề** | Crash khi env vars thiếu |
| **Status** | ✅ Hoà đã fix (commit `3bb0177`) |

---

### BUG-010: MT5 Python service — Single connection limitation

| Mục | Chi tiết |
|-----|---------|
| **Vấn đề** | Flask giữ 1 `MT5Connector` global → multi-user sẽ conflict |
| **Fix** | Cần session-based connector hoặc connection pool |
| **Priority** | Sprint 3 — khi có > 1 user |
| **Ai sửa** | **Hoà** |

---

## ✅ ĐÃ SỬA (by Hoà — commit `f6b9128`)

| # | Bug | Fix |
|---|-----|-----|
| ~~1~~ | `disconnectMT5` thiếu `});` → scope leak | ✅ Thêm `});` |
| ~~2~~ | `fetchAccountInfo` dùng POST, Flask dùng GET | ✅ Đổi sang GET |
| ~~3~~ | `fetchOpenPositions` dùng POST, Flask dùng GET | ✅ Đổi sang GET |

---

## 📊 Tóm tắt theo Assignee

| Ai sửa | Số bug | Ưu tiên |
|--------|--------|---------|
| **Sếp quyết** | 1 (BUG-001: Deploy backend) | 🔴 CRITICAL |
| **Frontend team** | 3 (BUG-002, BUG-004, BUG-007) | 🟡 HIGH |
| **Hoà** | 2 (BUG-005, BUG-010) | 🟡-🟢 |
| **Dũng** | 1 (BUG-006: Update docs) | 🟢 MEDIUM |
| **Tự fix khi backend online** | 3 (BUG-003, BUG-008, BUG-009✅) | — |

---

## 📊 Tổng

| Loại | Số lượng |
|------|---------|
| 🔴 Critical | 1 |
| 🟡 High | 4 |
| 🟢 Medium | 5 |
| ✅ Đã sửa | 3 |
| **Tổng** | **13** |
