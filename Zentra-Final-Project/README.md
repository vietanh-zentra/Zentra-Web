# Zentra Project — MT5 Analytics

Monorepo chứa toàn bộ mã nguồn của dự án Zentra Giai đoạn 1 (Kết nối MT5 và Data Pipeline).

## Cấu trúc thư mục
- `/mt5_engine/` — Service Python kết nối đến MetaTrader5 (Tác giả: Hoà). Chạy trên Windows.
- `/src/` — Backend Node.js API và MongoDB Models (Tác giả: Dũng). Chạy ở bất kì đâu (Docker/Vercel).
- `/tests/` — Bộ Test cases của hệ thống Node.js.
- `docker-compose.yml` — Cấu hình Docker để scale Node.js app và MongoDB.

## Kiến trúc triển khai (Deployment Architecture)
Do giới hạn kĩ thuật của MetaTrader5 (giao thức độc quyền và thư viện Python chỉ hỗ trợ Windows native), kiến trúc hệ thống bắt buộc chia làm 2 mảnh:
1. **Node.js API + MongoDB:** Chạy trên Cloud (Linux, Docker, Vercel).
2. **Python MT5 Engine:** BẮT BUỘC chạy trên một máy Windows (Windows VPS hoặc EC2 Windows).

## Hướng dẫn khởi chạy

### Bước 1: Khởi chạy MT5 Engine (Trên Windows)
1. Cài đặt Python 3.10+
2. Chạy MetaTrader5 (terminal64.exe) và đảm bảo nút AutoTrading đang bật.
3. Chạy lệnh:
   ```bash
   cd mt5_engine
   pip install -r requirements.txt
   waitress-serve --port=5000 app_v2:app
   ```

### Bước 2: Khởi chạy Database + API (Với Docker)
1. Đổi tên `.env.example` thành `.env` tại thư mục gốc.
2. Đảm bảo biến môi trường `MT5_ENGINE_URL` đang gọi đúng IP của máy Windows đang chạy MT5 Engine (vd: `http://host.docker.internal:5000` hoặc IP tĩnh).
3. Chạy lệnh:
   ```bash
   docker-compose up -d --build
   ```
4. Kiểm tra Backend có kết nối MT5 Controller: GET `http://localhost:3000/v1/health`

## Thiết kế dữ liệu
- File `API_REFERENCE.md` chứa toàn bộ API Specs cho frontend.
- Cấu trúc Models MongoDB (của Dũng) hoàn toàn 100% camelCase khớp nối với backend adapter của Hoà.

## Tests
Dự án đã pass hoàn chỉnh unit tests và integration tests.
```bash
npm run test
```
