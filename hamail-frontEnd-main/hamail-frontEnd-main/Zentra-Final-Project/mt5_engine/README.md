# Zentra MT5 Engine — Python Service

## Mô tả
MT5 Engine là service Python kết nối MetaTrader5 terminal, trích xuất dữ liệu giao dịch,
chuẩn hóa theo CONTRACT.md, và phục vụ qua Flask HTTP API cho Node.js backend.

## Kiến trúc
```
Node.js Backend (Vercel)  ──HTTP POST──▶  Python Flask (Windows VPS)
                                               │
                                        MetaTrader5 Terminal
```

## Yêu cầu
- **OS:** Windows (bắt buộc — MT5 lib chỉ chạy trên Windows)
- **Python:** 3.10+
- **MT5 Terminal:** Cài sẵn `C:\Program Files\MetaTrader 5\terminal64.exe`

## Cài đặt
```bash
pip install -r requirements.txt
```

## Cấu hình
Tạo file `.env`:
```env
MT5_API_KEY=your-secret-api-key-change-in-production
MT5_PATH=C:\Program Files\MetaTrader 5\terminal64.exe
MT5_SERVICE_PORT=5000
LOG_LEVEL=INFO
FLASK_DEBUG=false
```

## Chạy
```bash
# Development
python app_v2.py

# Production (Windows)
waitress-serve --port=5000 app_v2:app
```

## API Endpoints

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/health` | Health check |
| POST | `/connect` | Kết nối MT5 account |
| POST | `/trades` | Lấy lịch sử giao dịch |
| POST | `/sync` | Full sync (account + trades + positions) |
| POST | `/validate` | Kiểm tra chất lượng kết nối |

### Headers bắt buộc
```
Content-Type: application/json
X-API-Key: <your-api-key>
```

### Ví dụ: POST /connect
```json
{
  "accountId": 5049421223,
  "server": "MetaQuotes-Demo",
  "password": "1l!zBdGv"
}
```

### Ví dụ: POST /sync
```json
{
  "accountId": 5049421223,
  "server": "MetaQuotes-Demo",
  "password": "1l!zBdGv",
  "fromDate": "2026-04-01T00:00:00Z"
}
```

## Cấu trúc file
```
mt5-connector-main/
├── app_v2.py              ← Flask API (chạy file này)
├── mt5_connector.py       ← Core: connect/sync/trades
├── data_normalizer.py     ← Deal pairing + normalize
├── connection_validator.py← Health check
├── backend_adapter.py     ← snake_case → camelCase adapter
├── mt5_automation.py      ← UI automation (first-time login)
├── sample_payloads.py     ← 15 trade mẫu cho testing
├── test_validate.py       ← 12 test cases
├── requirements.txt
├── .env                   ← (tạo từ .env.example)
└── logs/                  ← Auto-generated log files
```

## Tests
```bash
python test_validate.py
```

## Tài liệu liên quan
- `CONTRACT.md` — Giao diện dữ liệu giữa Python ↔ Node.js
- `INTEGRATION_DECISION.md` — Quyết định kiến trúc
- `REVIEW_REPORT.md` — Review code Dũng
- `Zentra-backend-main/INTEGRATION_GUIDE.md` — Hướng dẫn tích hợp từ Dũng
