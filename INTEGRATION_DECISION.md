# INTEGRATION_DECISION.md — Quyết Định Tích Hợp MT5 Engine

**Date:** 2026-04-19
**Author:** Hoà (MT5 Engine Lead & Integration Owner)
**Purpose:** Chốt cách đặt MT5 engine vào hệ thống, dựa trên kết quả audit source code và hạ tầng.

---

## 1. Kết Quả Khảo Sát Hạ Tầng (Phase H1)

### 1.1. Kiến Trúc Backend Hiện Tại (Từ ARCHITECTURE_AUDIT.md của Dũng)
| Thành phần | Giá trị |
|------------|---------|
| Framework | Express.js (Node.js) |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT + Passport.js |
| Deployment | Vercel (serverless) |
| Containerization | Docker + docker-compose (có sẵn) |

### 1.2. Cách Backend Gọi MT5 Hiện Tại
Đã có sẵn luồng hoàn chỉnh:
```
Frontend → POST /v1/mt5/connect → mt5.controller.js → mt5.service.js → HTTP POST → Python Flask (app.py:5000)
```
- `mt5.service.js` gọi Python qua HTTP với header `X-API-Key`.
- Timeout: 30s cho connect, 60s cho trades.
- Password được mã hóa AES-256-GCM trước khi lưu vào MongoDB.

### 1.3. Đánh Giá Khả Năng Chạy MT5
| Yếu tố | Đánh giá |
|---------|----------|
| **MetaTrader5 Python lib** | Chỉ chạy trên **Windows** (yêu cầu `terminal64.exe`) |
| **Vercel (production hiện tại)** | Linux serverless → **KHÔNG chạy được MT5 trực tiếp** |
| **Local dev (máy Hoà)** | Windows → ✅ Chạy được, đã test thành công |
| **AWS khảo sát (20/04/2026)** | ✅ Đã audit — Account trống hoàn toàn (xem chi tiết bên dưới) |

### 1.4. Kết Quả Audit AWS (20/04/2026)
- **Region:** `ap-southeast-2` (Asia Pacific — Sydney)
- **Account ID:** `415066135731`
- **IAM User:** `vietanh.zentra@gmail.com` (quyền bị giới hạn)

| Service | Kết quả |
|---------|---------|
| **EC2** | ❌ Access Denied — không thấy instance nào |
| **S3** | 0 buckets |
| **RDS** | 0 databases, 0 clusters |
| **Lambda** | ❌ Access Denied (`lambda:ListFunctions` unauthorized) |
| **Elastic Beanstalk** | 0 applications, 0 environments |

**Kết luận:** AWS account của khách hoàn toàn trống. Không có hạ tầng nào để bám theo.
**Recommendation cập nhật:** Thuê Windows VPS riêng cho MT5 service (không dùng AWS).

### 1.5. Rủi Ro Phát Hiện
- **RỦI RO NGHIÊM TRỌNG:** Vercel là Linux serverless. MT5 Python library KHÔNG thể chạy trên Vercel.
- **Phương án:** MT5 Python service BẮT BUỘC phải chạy trên một máy Windows riêng (VPS Windows / EC2 Windows / máy local).
- Backend Node.js (Vercel) gọi sang MT5 service (Windows) qua HTTP — đây chính xác là kiến trúc hiện tại đã có.

---

## 2. Quyết Định Tích Hợp

### 2.1. Database: GIỮ NGUYÊN MongoDB
- Source code khách đang dùng MongoDB + Mongoose.
- Model `Trade` đã có sẵn, chỉ cần mở rộng thêm fields.
- **KHÔNG dùng Neon/PostgreSQL** — bám theo codebase hiện có.

### 2.2. Kiến Trúc: GIỮ NGUYÊN Microservice (Node.js ↔ Python Flask)
```
┌──────────────────────────┐         ┌─────────────────────────────┐
│  Vercel (Linux)          │  HTTP   │  Windows VPS / Local        │
│  Node.js Backend         │────────▶│  Python MT5 Service         │
│  - mt5.service.js        │  API    │  - mt5_connector.py         │
│  - mt5.controller.js     │  Key    │  - data_normalizer.py       │
│  - MongoDB               │         │  - connection_validator.py  │
└──────────────────────────┘         │  - app.py (Flask API)       │
                                      │  - MetaTrader5 lib          │
                                      └─────────────────────────────┘
```

### 2.3. Repo: GIỮ CHUNG repo, tách thư mục
```
Zentra-Web/
├── src/                    # Node.js backend (Dũng quản lý)
├── mt5_engine/             # Python MT5 engine (Hoà quản lý)
│   ├── mt5_connector.py
│   ├── data_normalizer.py
│   ├── connection_validator.py
│   ├── app.py              # Flask API wrapper
│   ├── requirements.txt
│   └── Dockerfile
├── tests/
└── docker-compose.yml
```

### 2.4. Giao Tiếp Giữa 2 Module
| Từ | Đến | Phương thức | Chi tiết |
|----|-----|-------------|----------|
| Node.js `mt5.service.js` | Python `app.py` | HTTP POST | `/connect`, `/trades`, `/sync` |
| Python `app.py` | MetaTrader5 | Python lib | `mt5.initialize()`, `mt5.history_deals_get()` |
| Python trả về | Node.js nhận | JSON | Theo đúng `CONTRACT.md` |

---

## 3. Yêu Cầu Hạ Tầng Cho Deploy

### 3.1. Nếu AWS là Linux (EC2 Linux)
- Node.js backend: Deploy trên Vercel (giữ nguyên).
- MT5 Python service: **PHẢI** chạy trên Windows VPS riêng (AWS EC2 Windows hoặc VPS khác).
- Kết nối: Node.js → HTTP → Windows VPS (public IP hoặc VPN).

### 3.2. Nếu AWS là Windows (EC2 Windows)
- Có thể chạy cả Node.js và Python trên cùng 1 máy.
- Hoặc giữ Node.js trên Vercel, chỉ đặt Python service trên EC2 Windows.

### 3.3. Recommendation
**Phương án khuyến nghị:** Giữ Vercel cho Node.js + Thuê 1 Windows VPS nhỏ cho Python MT5 service.
- Chi phí: ~$15-25/tháng cho Windows VPS.
- Lý do: Đơn giản nhất, không phá vỡ deployment flow hiện tại.

---

## 4. Action Items Tiếp Theo
- [ ] Xác nhận với quản lý dự án về credentials AWS để audit chi tiết hơn.
- [ ] Nếu không có AWS, đề xuất thuê Windows VPS cho MT5 service.
- [x] Chốt giao tiếp: HTTP + API Key (đã có sẵn trong codebase).
- [x] Chốt database: MongoDB (đã có sẵn).
- [x] Chốt repo: Chung repo, tách thư mục `/mt5_engine/`.
