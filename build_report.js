const fs = require('fs');
const img = (n) => { const p=`screenshots/${n}.png`; return fs.existsSync(p)?fs.readFileSync(p,{encoding:'base64'}):''; };

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Zentra Phase 1 — Progress Report</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;color:#1e293b;background:#d1d5db;font-size:10pt;line-height:1.55}

/* PRINT: Only cover gets a forced page-break. Everything else flows naturally */
@page{size:A4;margin:12mm}
@media print{
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
  body{background:#fff}
  .wrapper{box-shadow:none!important;margin:0!important;width:100%!important}
  .cover-wrap{page-break-after:always}
  .avoid-break{page-break-inside:avoid}
}

.wrapper{
  width:210mm;margin:8px auto;background:#fff;
  box-shadow:0 2px 20px rgba(0,0,0,.12);
  overflow:hidden;
}

/* ===== COVER ===== */
.cover-wrap{background:#fff}
.cover{
  width:100%;min-height:270mm;
  padding:0 50px;
  background:#f8fafc;
  background-image:
    radial-gradient(circle at 75% 20%,rgba(216,180,254,.4),transparent 55%),
    radial-gradient(circle at 25% 80%,rgba(191,219,254,.4),transparent 55%);
  display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;
  position:relative;
}
.cover-line{position:absolute;top:0;left:0;width:100%;height:5px;background:linear-gradient(90deg,#4f46e5,#0ea5e9)}
.vq-brand{margin-bottom:50px}
.vq-name{color:#4f46e5;letter-spacing:16px;font-weight:800;font-size:13pt;margin-bottom:10px;margin-right:-16px}
.vq-div{color:#6b7280;letter-spacing:10px;font-size:7pt;font-weight:600;text-transform:uppercase;margin-right:-10px}
.cover-pill{display:inline-block;background:#e0e7ff;color:#4338ca;padding:9px 30px;border-radius:30px;font-size:8pt;font-weight:700;letter-spacing:4px;text-transform:uppercase;margin-bottom:32px;margin-right:-4px}
.cover-title{font-size:42pt;font-weight:900;color:#0f172a;line-height:1.08;letter-spacing:-1.5px;margin-bottom:18px}
.cover-sub{font-size:10pt;color:#6b7280;font-weight:500;letter-spacing:2.5px;margin-bottom:90px;text-transform:uppercase}
.cover-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px 80px;text-align:left;width:58%}
.cg-label{font-size:7.5pt;color:#9ca3af;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:5px}
.cg-value{font-size:10pt;color:#111827;font-weight:600}
.cover-footer{position:absolute;bottom:28px;width:100%;text-align:center;font-size:7pt;color:#9ca3af;letter-spacing:1px;text-transform:uppercase}

/* ===== FLOWING CONTENT (no page breaks!) ===== */
.flow{padding:24px 32px}
.sec-head{display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:10px 16px;border-radius:0 8px 8px 0;border-left:4px solid #3b82f6;background:#eff6ff}
.sec-head.green{border-color:#22c55e;background:#f0fdf4}
.sec-head.orange{border-color:#f97316;background:#fff7ed}
.sec-head.purple{border-color:#8b5cf6;background:#f5f3ff}
.sec-head.red{border-color:#ef4444;background:#fef2f2}
.sec-head.teal{border-color:#14b8a6;background:#f0fdfa}
.sec-title{font-size:13pt;font-weight:800;color:#0f172a;letter-spacing:-.5px}
.text{margin-bottom:10px;color:#374151;font-size:9pt}

.tasks{display:flex;flex-direction:column;gap:8px;margin-bottom:12px}
.task{background:#fff;border:1px solid #e5e7eb;border-radius:7px;padding:10px 12px;display:flex;align-items:flex-start;gap:10px}
.task-badge{font-family:'JetBrains Mono',monospace;font-size:7.5pt;font-weight:600;padding:3px 7px;border-radius:5px;flex-shrink:0;white-space:nowrap}
.task-badge.blue{background:#dbeafe;color:#1d4ed8}
.task-badge.green{background:#dcfce7;color:#166534}
.task-name{font-size:9.5pt;font-weight:700;color:#111827;margin-bottom:2px}
.task-desc{font-size:8pt;color:#4b5563}

.shots{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}
.shot{background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden}
.shot.wide{grid-column:1/-1}
.shot-head{background:#f8fafc;border-bottom:1px solid #e5e7eb;padding:6px 10px;display:flex;justify-content:space-between;align-items:center}
.shot-title{font-size:8.5pt;font-weight:700;color:#111827}
.shot-tag{font-family:'JetBrains Mono',monospace;font-size:6.5pt;font-weight:600;color:#4f46e5;background:#e0e7ff;padding:2px 6px;border-radius:4px}
.shot img{width:100%;display:block;height:auto;max-height:180px;object-fit:cover;object-position:top;background:#f1f5f9}
.shot.wide img{max-height:200px}
.shot-cap{padding:6px 10px;font-size:7.5pt;color:#4b5563;border-top:1px solid #e5e7eb}

.z-table{width:100%;border-collapse:collapse;border:1px solid #e5e7eb;overflow:hidden;margin-bottom:12px}
.z-table th{background:#f9fafb;color:#4b5563;font-weight:600;font-size:7.5pt;text-transform:uppercase;padding:8px 10px;text-align:left}
.z-table td{padding:7px 10px;border-top:1px solid #e5e7eb;font-size:8.5pt;color:#1f2937}
.pill{display:inline-block;padding:2px 8px;border-radius:20px;font-size:6.5pt;font-weight:700;text-transform:uppercase}
.pill-green{background:#dcfce7;color:#166534}
.pill-yellow{background:#fef9c3;color:#854d0e}

.arch-box{background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-bottom:12px;font-family:'JetBrains Mono',monospace;font-size:7.5pt;color:#334155;line-height:1.65;white-space:pre}

.divider{height:1px;background:#e5e7eb;margin:16px 0}
</style>
</head>
<body>

<div class="wrapper">

<!-- ====== COVER (only this gets a page-break) ====== -->
<div class="cover-wrap">
  <div class="cover">
    <div class="cover-line"></div>
    <div class="vq-brand">
      <div class="vq-name">V Q U A N T</div>
      <div class="vq-div">W E B 3&nbsp;&nbsp;&nbsp;E N G I N E E R I N G&nbsp;&nbsp;&nbsp;D I V I S I O N</div>
    </div>
    <div class="cover-pill">P H A S E&nbsp;&nbsp;1&nbsp;&nbsp;—&nbsp;&nbsp;R E P O R T</div>
    <div class="cover-title">Zentra MT5 Engine</div>
    <div class="cover-sub">MetaTrader 5 Integration · Progress Report</div>
    <div class="cover-grid">
      <div><div class="cg-label">Project</div><div class="cg-value">MT5 Engine + Node.js API</div></div>
      <div><div class="cg-label">Platform</div><div class="cg-value">Windows / Docker</div></div>
      <div><div class="cg-label">Document Type</div><div class="cg-value">Phase 1 — Progress Report</div></div>
      <div><div class="cg-label">Version</div><div class="cg-value">v1.0 — April 2026</div></div>
      <div><div class="cg-label">Team</div><div class="cg-value">Đàm Văn Hoà & Nguyễn Mạnh Dũng</div></div>
      <div><div class="cg-label">Status</div><div class="cg-value" style="color:#059669">Completed</div></div>
    </div>
    <div class="cover-footer">VQuant — Phase 1 Progress Report v1.0 · Confidential</div>
  </div>
</div>

<!-- ====== ALL CONTENT FLOWS CONTINUOUSLY — NO PAGE BREAKS ====== -->
<div class="flow">

  <!-- 01 Architecture -->
  <div class="sec-head purple avoid-break"><div class="sec-title">01. System Architecture</div></div>
  <div class="text">Zentra is a psychological performance dashboard for Forex traders. Phase 1 delivers the core data pipeline: connecting MetaTrader 5 terminals, extracting trade history, normalizing it, and storing it via a scalable REST API.</div>
  <div class="arch-box avoid-break">Trader inputs Account ID + Server + Password
      │
      ▼
┌──────────────────────────────┐
│  Python MT5 Engine (Flask)   │  ← Đàm Văn Hoà
│  Connect · Extract · Normalize│
└──────────────┬───────────────┘
               │  Standardized JSON
               ▼
┌──────────────────────────────┐
│  Node.js REST API (Docker)   │  ← Nguyễn Mạnh Dũng
│  10 Endpoints · MongoDB · JWT│
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Next.js Frontend (Vercel)   │  ← Client (existing)
│  Dashboard · Trades · Analysis│
└──────────────────────────────┘</div>

  <!-- 02 Hoà -->
  <div class="sec-head avoid-break"><div class="sec-title">02. MT5 Engine — Đàm Văn Hoà</div></div>
  <div class="text">Full Python connectivity engine: extracts live data from MetaTrader 5, normalizes broker-specific formats, and exposes via Flask API.</div>
  <div class="tasks">
    <div class="task avoid-break"><div class="task-badge blue">H1–H2</div><div><div class="task-name">MT5 Connector & Account Extraction</div><div class="task-desc">Built <code>mt5_connector.py</code> — login, session management, extraction of balance/equity/leverage across prop-firm and personal broker accounts.</div></div></div>
    <div class="task avoid-break"><div class="task-badge blue">H3–H4</div><div><div class="task-name">Deal IN/OUT Normalizer & Connection Validator</div><div class="task-desc"><code>data_normalizer.py</code> pairs Deal Entry (IN) and Exit (OUT) by position_id. Handles null SL/TP. <code>connection_validator.py</code> verifies connectivity.</div></div></div>
    <div class="task avoid-break"><div class="task-badge blue">H5–H7</div><div><div class="task-name">Flask API & E2E Testing</div><div class="task-desc"><code>app_v2.py</code> endpoints: /connect, /account-info, /history, /positions, /full-sync. Sub-second response confirmed.</div></div></div>
  </div>

  <!-- 03 Dũng -->
  <div class="sec-head green avoid-break"><div class="sec-title">03. Backend REST API — Nguyễn Mạnh Dũng</div></div>
  <div class="text">Complete Node.js backend with MongoDB, handling data persistence, user authentication, and trade management.</div>
  <div class="tasks">
    <div class="task avoid-break"><div class="task-badge green">D1–D3</div><div><div class="task-name">MongoDB Schemas & Route Architecture</div><div class="task-desc">5 collections: Account, Trade, OpenPosition, DailySummary, SyncLog. 10 REST endpoints with JSDoc, bulk insert, CRUD.</div></div></div>
    <div class="task avoid-break"><div class="task-badge green">D4–D5</div><div><div class="task-name">Error Handling & Performance Testing</div><div class="task-desc">Unified <code>errorCodes.js</code>. Bulk: 1,000 trades in &lt;5s. Standardized API response format.</div></div></div>
    <div class="task avoid-break"><div class="task-badge green">D6–D7</div><div><div class="task-name">Docker + API Documentation</div><div class="task-desc"><code>node:18-alpine</code> Docker + <code>docker-compose.yml</code> via <code>host.docker.internal</code>. Full <code>API_DOCS.md</code>.</div></div></div>
  </div>

  <!-- 04 API Table -->
  <div class="sec-head orange avoid-break"><div class="sec-title">04. API Endpoints</div></div>
  <table class="z-table avoid-break">
    <thead><tr><th>Method</th><th>Endpoint</th><th>Description</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td>POST</td><td>/v1/mt5/connect</td><td>Connect MT5 account</td><td><span class="pill pill-green">Done</span></td></tr>
      <tr><td>POST</td><td>/v1/mt5/sync</td><td>Sync trades from MT5</td><td><span class="pill pill-green">Done</span></td></tr>
      <tr><td>GET</td><td>/v1/mt5/status</td><td>Connection status</td><td><span class="pill pill-green">Done</span></td></tr>
      <tr><td>DELETE</td><td>/v1/mt5/disconnect</td><td>Disconnect MT5</td><td><span class="pill pill-green">Done</span></td></tr>
      <tr><td>GET</td><td>/v1/trades</td><td>List all trades</td><td><span class="pill pill-green">Done</span></td></tr>
      <tr><td>POST</td><td>/v1/trades/bulk</td><td>Bulk import trades</td><td><span class="pill pill-green">Done</span></td></tr>
      <tr><td>GET</td><td>/v1/dashboard</td><td>Dashboard metrics</td><td><span class="pill pill-green">Done</span></td></tr>
      <tr><td>GET</td><td>/v1/analysis/state</td><td>Psychological analysis</td><td><span class="pill pill-green">Done</span></td></tr>
      <tr><td>POST</td><td>/v1/auth/login</td><td>JWT Authentication</td><td><span class="pill pill-green">Done</span></td></tr>
      <tr><td>GET</td><td>/v1/health</td><td>System health check</td><td><span class="pill pill-green">Done</span></td></tr>
    </tbody>
  </table>

  <div class="divider"></div>

  <!-- 05 Screenshots: Landing + Login + Questionnaire -->
  <div class="sec-head teal avoid-break"><div class="sec-title">05. Platform & Auth — Live Screenshots</div></div>
  <div class="text">All screenshots captured from the genuine Zentra Next.js frontend running locally against our integrated backend.</div>
  <div class="shots">
    <div class="shot wide">
      <div class="shot-head"><div class="shot-title">Zentra Landing Page</div><div class="shot-tag">/</div></div>
      <img src="data:image/png;base64,${img('home')}" alt="Home">
      <div class="shot-cap"><strong>Platform Entry:</strong> "World's first psychological performance dashboard for traders". Responsive hero with animations.</div>
    </div>
    <div class="shot">
      <div class="shot-head"><div class="shot-title">Login / Register</div><div class="shot-tag">/auth/login</div></div>
      <img src="data:image/png;base64,${img('login')}" alt="Login">
      <div class="shot-cap"><strong>JWT Auth:</strong> Token-based login backed by <code>/v1/auth</code> API.</div>
    </div>
    <div class="shot">
      <div class="shot-head"><div class="shot-title">Psychology Questionnaire</div><div class="shot-tag">/questionnaire</div></div>
      <img src="data:image/png;base64,${img('questionnaire')}" alt="Questionnaire">
      <div class="shot-cap"><strong>Profiling:</strong> Trader mindset data for Phase 2 analysis.</div>
    </div>
  </div>

  <!-- 06 Dashboard -->
  <div class="sec-head orange avoid-break"><div class="sec-title">06. Dashboard Analytics</div></div>
  <div class="text">Mental Battery, Plan Control, Behavior Heatmap, Psychological Traits, Stability Trend — all powered by our API layer.</div>
  <div class="shots">
    <div class="shot wide">
      <div class="shot-head"><div class="shot-title">Dashboard Overview — Full Analytics</div><div class="shot-tag">/dashboard</div></div>
      <img src="data:image/png;base64,${img('dash_full')}" alt="Dashboard">
      <div class="shot-cap"><strong>Core View:</strong> Mental Battery, Breathwork, Plan Control, Psychological Traits radar, Behavior Heatmap, Stability Trend. Data from <code>/v1/dashboard</code> + <code>/v2/zentra/*</code>.</div>
    </div>
    <div class="shot">
      <div class="shot-head"><div class="shot-title">About Zentra</div><div class="shot-tag">/about</div></div>
      <img src="data:image/png;base64,${img('about')}" alt="About">
      <div class="shot-cap"><strong>Mission:</strong> Transform trading psychology through data-driven insights.</div>
    </div>
    <div class="shot">
      <div class="shot-head"><div class="shot-title">Pricing</div><div class="shot-tag">/pricing</div></div>
      <img src="data:image/png;base64,${img('pricing')}" alt="Pricing">
      <div class="shot-cap"><strong>Monetization:</strong> Subscription tiers with Stripe integration.</div>
    </div>
  </div>

  <!-- 07 MT5 + Trades -->
  <div class="sec-head avoid-break"><div class="sec-title">07. MT5 Connect & Trade Management</div></div>
  <div class="text">The core Phase 1 feature — connecting MetaTrader 5 accounts and syncing trade history for psychological analysis.</div>
  <div class="shots">
    <div class="shot wide">
      <div class="shot-head"><div class="shot-title">MT5 Account Connection</div><div class="shot-tag">/dashboard/connect</div></div>
      <img src="data:image/png;base64,${img('connect_full')}" alt="MT5 Connect">
      <div class="shot-cap"><strong>Engine Core:</strong> Input MT5 credentials → calls <code>/v1/mt5/connect</code> → Python Flask engine → extracts & normalizes data.</div>
    </div>
    <div class="shot">
      <div class="shot-head"><div class="shot-title">Trade History</div><div class="shot-tag">/dashboard/trades</div></div>
      <img src="data:image/png;base64,${img('trades_full')}" alt="Trades">
      <div class="shot-cap"><strong>Trade Pipeline:</strong> Synced trades with entry/exit, P&L, duration. Bulk import via <code>/v1/trades/bulk</code>.</div>
    </div>
    <div class="shot">
      <div class="shot-head"><div class="shot-title">Trading Plan</div><div class="shot-tag">/dashboard/plan</div></div>
      <img src="data:image/png;base64,${img('plan_full')}" alt="Plan">
      <div class="shot-cap"><strong>Plan Management:</strong> Create & track plans via <code>/v1/trading-plan</code> endpoints.</div>
    </div>
  </div>

  <div class="divider"></div>

  <!-- 08 Status -->
  <div class="sec-head red avoid-break"><div class="sec-title">08. Deployment Status</div></div>
  <table class="z-table avoid-break">
    <thead><tr><th>Milestone</th><th>Status</th><th>Detail</th></tr></thead>
    <tbody>
      <tr><td>Python MT5 Engine</td><td><span class="pill pill-green">Done</span></td><td>5 Flask endpoints, deal normalizer, connection validator</td></tr>
      <tr><td>Node.js Backend</td><td><span class="pill pill-green">Done</span></td><td>10 REST endpoints, MongoDB, JWT auth, Docker</td></tr>
      <tr><td>GitHub Push</td><td><span class="pill pill-green">Done</span></td><td>github.com/vietanh-zentra/Zentra-Web</td></tr>
      <tr><td>Local Testing</td><td><span class="pill pill-green">Done</span></td><td>Frontend + Backend + DB verified via Docker</td></tr>
      <tr><td>AWS Deploy</td><td><span class="pill pill-yellow">Blocked</span></td><td>Awaiting IAM permissions from client</td></tr>
      <tr><td>MT5 Live Sync</td><td><span class="pill pill-yellow">Blocked</span></td><td>Requires Windows VPS for MetaTrader5 library</td></tr>
    </tbody>
  </table>
  <div style="text-align:center;margin-top:14px;padding-bottom:10px;font-weight:500;color:#6b7280;font-size:9pt">— End of Phase 1 Progress Report —</div>

</div>
</div>

</body></html>`;

fs.writeFileSync('Zentra_Phase1_Report_Final.html', html);
console.log('✓ Report created: Zentra_Phase1_Report_Final.html');
