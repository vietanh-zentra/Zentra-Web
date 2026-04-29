# 📝 NOTE CHO DŨNG — Phase 2 Tasks Còn Thiếu

**Ngày:** 29/04/2026  
**Từ:** Hoà  

---

## Phần D1: Mental Battery UI (commit `d06d1cd`)

| Task | Status | Ghi chú |
|---|---|---|
| D1.1 Redesign layout → arc gauge | ❌ Chưa làm | Vẫn dùng `brain1.png` rotating, chưa có circular gauge/arc meter |
| D1.2 Animated state transitions | ❌ Chưa làm | Chỉ rotate brain giống cũ, chưa có color gradient đỏ→vàng→xanh |
| D1.3 Pulse/glow effect | ⚠️ Sơ sài | Có `bg-teal-200/20 blur-3xl` nhưng static — cần đổi màu theo level |
| D1.4 Status message động | ❌ Chưa làm | Props `message` nhận vào nhưng **không render** trong JSX. API đã trả message sẵn rồi, chỉ cần hiển thị |
| D1.5 Responsive | ✅ OK | |
| D1.6 No-data state | ✅ Done | |

---

## Phần D3: Behavior Cards — Chưa bắt đầu

Backend API đã push xong, Dũng cần làm:

| Task | API Endpoint | Response chính |
|---|---|---|
| D3.1 Revenge Trading Card | `GET /v1/behavior/revenge-trading` | `{ detected, count, severity, revenge_rate, trades[] }` |
| D3.2 Early Exit Card | `GET /v1/behavior/early-exits` | `{ rate, count, potential_missed_profit, trades[] }` |
| D3.3 Overtrading Card | `GET /v1/behavior/overtrading` | `{ detected, daily_avg, peak_day, daily_breakdown[] }` |
| D3.4 Update PsychologicalStateDistribution | `GET /v1/behavior/full-analysis` | Combined response |
| D3.5 Update PsychologicalStabilityTrend | Dùng data từ full-analysis | |
| D3.6 API hooks (`useBehavior.js`) | Tất cả 6 endpoints | Hook gọi API behavioral |

### Cách dùng API:

```
GET /v1/behavior/revenge-trading?date=2026-04-29
GET /v1/behavior/early-exits?startDate=2026-04-01&endDate=2026-04-29
GET /v1/behavior/mental-battery?date=2026-04-29
```

- Cần **auth token** trong header: `Authorization: Bearer <token>`
- Response format chi tiết xem trong `mt5_engine/behavior_analyzer.py`

---

**Ưu tiên:** D1.1 (arc gauge) → D1.4 (hiện message) → D3.6 (hooks) → D3.1-D3.3 (cards)
