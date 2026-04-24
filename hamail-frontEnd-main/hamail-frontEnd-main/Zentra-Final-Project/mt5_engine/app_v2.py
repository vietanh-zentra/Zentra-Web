"""
MT5 Service v2 — Flask API (Phase H7 Integration)

Clean Flask API wrapper that uses the modular MT5 Engine components:
  - mt5_connector.py (connect, sync, trades)
  - data_normalizer.py (deal pairing, format conversion)
  - connection_validator.py (health checks)
  - backend_adapter.py (snake_case → camelCase for Node.js)

Endpoints:
  POST /connect      — Connect to MT5 account
  POST /trades       — Fetch trade history
  POST /sync         — Full sync (account + trades + positions)
  GET  /health       — Health check
  POST /validate     — Validate connection quality

Author: Hoà (MT5 Engine Lead)
"""
import os
import logging
from datetime import datetime
from logging.handlers import RotatingFileHandler
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from mt5_connector import MT5Connector
from connection_validator import ConnectionValidator
from backend_adapter import (
    build_connect_response,
    build_trades_response,
    build_sync_response,
    adapt_trades_for_backend,
    adapt_positions_for_backend,
    adapt_account_for_backend,
    map_error_code,
    get_error_http_status,
)

load_dotenv()

# ─── Logging ──────────────────────────────────────────────────────────
LOG_DIR = os.getenv('LOG_DIR', 'logs')
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        RotatingFileHandler(
            os.path.join(LOG_DIR, 'mt5_service.log'),
            maxBytes=10 * 1024 * 1024,
            backupCount=5,
            encoding='utf-8'
        )
    ]
)
logger = logging.getLogger(__name__)

# ─── Flask App ────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

API_KEY = os.getenv('MT5_API_KEY', 'your-secret-api-key-change-in-production')

# Global connector instance (reused across requests)
connector = MT5Connector()


def validate_api_key():
    """Validate X-API-Key header."""
    api_key = request.headers.get('X-API-Key')
    if not api_key or api_key != API_KEY:
        logger.warning(f'Unauthorized access from {request.remote_addr}')
        return jsonify({
            "success": False,
            "errorCode": "UNAUTHORIZED",
            "message": "Invalid or missing API key"
        }), 401
    return None


def get_required_fields(data, fields):
    """Validate required fields in request JSON."""
    missing = [f for f in fields if f not in data or data[f] is None]
    if missing:
        return None, jsonify({
            "success": False,
            "errorCode": "VALIDATION_ERROR",
            "message": f"Missing required fields: {', '.join(missing)}"
        }), 400
    return data, None, None


# ─── POST /connect ────────────────────────────────────────────────────
@app.route('/connect', methods=['POST'])
def connect():
    """
    Connect to MT5 account.
    Expected by: mt5.service.js → connectMT5Account()

    Request:
        {
            "accountId": 12345678,
            "server": "MetaQuotes-Demo",
            "password": "xxx",
            "manualLogin": false  (optional)
        }

    Response (success):
        {
            "success": true,
            "accountId": "12345678",
            "server": "MetaQuotes-Demo",
            "balance": 10000.00,
            ...
        }

    Response (error):
        {
            "success": false,
            "errorCode": "MT5_INVALID_CREDENTIALS",
            "message": "...",
            "statusCode": 401
        }
    """
    auth_error = validate_api_key()
    if auth_error:
        return auth_error

    if not request.is_json:
        return jsonify({"success": False, "errorCode": "VALIDATION_ERROR",
                        "message": "Request must be JSON"}), 400

    data = request.get_json()
    account_id = data.get('accountId')
    server = data.get('server')
    password = data.get('password')
    manual_login = data.get('manualLogin', False)

    if not all([account_id, server, password]):
        return jsonify({"success": False, "errorCode": "VALIDATION_ERROR",
                        "message": "Missing accountId, server, or password"}), 400

    logger.info(f"[API] /connect — account={account_id}, server={server}")

    result = connector.connect(int(account_id), password, server, manual_login)
    response, status = build_connect_response(result)
    return jsonify(response), status


# ─── POST /trades ─────────────────────────────────────────────────────
@app.route('/trades', methods=['POST'])
def trades():
    """
    Fetch trade history from MT5.
    Expected by: mt5.service.js → fetchMT5Trades()

    Request:
        {
            "accountId": 12345678,
            "server": "MetaQuotes-Demo",
            "password": "xxx",
            "fromDate": "2026-04-01T00:00:00Z",
            "toDate": "2026-04-20T00:00:00Z"
        }

    Response:
        {
            "success": true,
            "trades": [ ... camelCase trade objects ... ],
            "count": 15
        }
    """
    auth_error = validate_api_key()
    if auth_error:
        return auth_error

    if not request.is_json:
        return jsonify({"success": False, "errorCode": "VALIDATION_ERROR",
                        "message": "Request must be JSON"}), 400

    data = request.get_json()
    account_id = data.get('accountId')
    server = data.get('server')
    password = data.get('password')
    from_date_str = data.get('fromDate')
    to_date_str = data.get('toDate')

    if not all([account_id, server, password]):
        return jsonify({"success": False, "errorCode": "VALIDATION_ERROR",
                        "message": "Missing accountId, server, or password"}), 400

    logger.info(f"[API] /trades — account={account_id}, from={from_date_str}, to={to_date_str}")

    # Ensure connected
    conn_result = connector.connect(int(account_id), password, server)
    if not conn_result.get("connected"):
        response, status = build_connect_response(conn_result)
        return jsonify(response), status

    # Parse dates
    from_date = datetime.fromisoformat(from_date_str.replace('Z', '+00:00')).replace(tzinfo=None) if from_date_str else None
    to_date = datetime.fromisoformat(to_date_str.replace('Z', '+00:00')).replace(tzinfo=None) if to_date_str else None

    # Fetch and transform
    raw_trades = connector.get_trade_history(from_date, to_date)
    response, status = build_trades_response(raw_trades)

    logger.info(f"[API] /trades — returning {len(raw_trades)} trades")
    return jsonify(response), status


# ─── POST /sync ───────────────────────────────────────────────────────
@app.route('/sync', methods=['POST'])
def sync():
    """
    Full synchronization: account info + trade history + open positions + summary.

    Request:
        {
            "accountId": 12345678,
            "server": "MetaQuotes-Demo",
            "password": "xxx",
            "fromDate": "2026-04-01T00:00:00Z"  (optional)
        }

    Response:
        {
            "success": true,
            "trades": [ ... camelCase ... ],
            "openPositions": [ ... ],
            "accountInfo": { ... },
            "summary": { ... },
            "syncTimeMs": 1234,
            "totalTradesFetched": 15,
            "count": 15
        }
    """
    auth_error = validate_api_key()
    if auth_error:
        return auth_error

    if not request.is_json:
        return jsonify({"success": False, "errorCode": "VALIDATION_ERROR",
                        "message": "Request must be JSON"}), 400

    data = request.get_json()
    account_id = data.get('accountId')
    server = data.get('server')
    password = data.get('password')
    from_date_str = data.get('fromDate')

    if not all([account_id, server, password]):
        return jsonify({"success": False, "errorCode": "VALIDATION_ERROR",
                        "message": "Missing accountId, server, or password"}), 400

    logger.info(f"[API] /sync — account={account_id}")

    # Ensure connected
    conn_result = connector.connect(int(account_id), password, server)
    if not conn_result.get("connected"):
        response, status = build_connect_response(conn_result)
        return jsonify(response), status

    # Parse from_date
    from_date = None
    if from_date_str:
        from_date = datetime.fromisoformat(from_date_str.replace('Z', '+00:00')).replace(tzinfo=None)

    # Full sync
    try:
        sync_data = connector.full_sync(from_date)
        response, status = build_sync_response(sync_data)
        logger.info(f"[API] /sync — complete: {sync_data.get('total_trades_fetched', 0)} trades")
        return jsonify(response), status
    except Exception as e:
        logger.error(f"[API] /sync — ERROR: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "errorCode": "MT5_DATA_FETCH_FAILED",
            "message": str(e),
            "statusCode": 502,
        }), 502


# ─── GET /health ──────────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        "success": True,
        "service": "mt5-connector",
        "version": "2.0.0",
        "status": "running",
        "timestamp": datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
    }), 200


# ─── POST /validate ──────────────────────────────────────────────────
@app.route('/validate', methods=['POST'])
def validate():
    """
    Validate MT5 connection quality.

    Request:
        {
            "accountId": 12345678,
            "server": "MetaQuotes-Demo",
            "password": "xxx"
        }

    Response:
        Validation report with server_reachable, login_successful, etc.
    """
    auth_error = validate_api_key()
    if auth_error:
        return auth_error

    if not request.is_json:
        return jsonify({"success": False, "message": "Request must be JSON"}), 400

    data = request.get_json()
    account_id = data.get('accountId')
    server = data.get('server')
    password = data.get('password')

    if not all([account_id, server, password]):
        return jsonify({"success": False, "message": "Missing credentials"}), 400

    report = ConnectionValidator.validate_connection(
        connector, int(account_id), password, server
    )

    return jsonify({"success": True, "report": report}), 200


# ─── GET /account-info ──────────────────────────────────────────────
@app.route('/account-info', methods=['GET'])
def account_info():
    """Get basic account info (requires prior /connect)."""
    auth_error = validate_api_key()
    if auth_error:
        return auth_error

    if not connector.connected:
        return jsonify({"success": False, "errorCode": "NOT_CONNECTED",
                        "message": "No MT5 session active. Call /connect first."}), 400

    info = connector.get_account_info()
    if not info:
        return jsonify({"success": False, "errorCode": "MT5_DATA_FETCH_FAILED",
                        "message": "Could not fetch account info"}), 502

    return jsonify({"success": True, **info}), 200


# ─── GET /account/full ───────────────────────────────────────────────
@app.route('/account/full', methods=['GET'])
def account_full():
    """
    [H-NEW-1] Full account information — all ~40 fields.
    """
    auth_error = validate_api_key()
    if auth_error:
        return auth_error

    if not connector.connected:
        return jsonify({"success": False, "errorCode": "NOT_CONNECTED",
                        "message": "No MT5 session active. Call /connect first."}), 400

    info = connector.get_account_info_full()
    if not info:
        return jsonify({"success": False, "errorCode": "MT5_DATA_FETCH_FAILED",
                        "message": "Could not fetch full account info"}), 502

    return jsonify({"success": True, "account": info}), 200


# ─── GET /symbols ────────────────────────────────────────────────────
@app.route('/symbols', methods=['GET'])
def symbols():
    """
    [H-NEW-2] Get all available symbols with market data.
    Query params: ?group=*USD* (optional filter)
    """
    auth_error = validate_api_key()
    if auth_error:
        return auth_error

    if not connector.connected:
        return jsonify({"success": False, "errorCode": "NOT_CONNECTED",
                        "message": "No MT5 session active. Call /connect first."}), 400

    group = request.args.get('group')
    logger.info(f"[API] /symbols — group={group}")

    symbols_data = connector.get_symbols_info(group)
    return jsonify({
        "success": True,
        "symbols": symbols_data,
        "count": len(symbols_data),
    }), 200


# ─── GET /symbol/<name> ─────────────────────────────────────────────
@app.route('/symbol/<symbol_name>', methods=['GET'])
def symbol_detail(symbol_name):
    """Get detailed info for a single symbol."""
    auth_error = validate_api_key()
    if auth_error:
        return auth_error

    if not connector.connected:
        return jsonify({"success": False, "errorCode": "NOT_CONNECTED",
                        "message": "No MT5 session active."}), 400

    logger.info(f"[API] /symbol/{symbol_name}")
    info = connector.get_symbol_info(symbol_name)
    if not info:
        return jsonify({"success": False, "errorCode": "SYMBOL_NOT_FOUND",
                        "message": f"Symbol '{symbol_name}' not found"}), 404

    return jsonify({"success": True, "symbol": info}), 200


# ─── GET /orders/pending ─────────────────────────────────────────────
@app.route('/orders/pending', methods=['GET'])
def pending_orders():
    """
    [H-NEW-3] Get currently active pending orders.
    """
    auth_error = validate_api_key()
    if auth_error:
        return auth_error

    if not connector.connected:
        return jsonify({"success": False, "errorCode": "NOT_CONNECTED",
                        "message": "No MT5 session active."}), 400

    logger.info("[API] /orders/pending")
    orders = connector.get_pending_orders()
    return jsonify({
        "success": True,
        "orders": orders,
        "count": len(orders),
    }), 200


# ─── POST /orders/history ────────────────────────────────────────────
@app.route('/orders/history', methods=['POST'])
def order_history():
    """
    [H-NEW-4] Get historical orders.
    Request: { "fromDate": "...", "toDate": "..." } (optional)
    """
    auth_error = validate_api_key()
    if auth_error:
        return auth_error

    if not connector.connected:
        return jsonify({"success": False, "errorCode": "NOT_CONNECTED",
                        "message": "No MT5 session active."}), 400

    data = request.get_json() if request.is_json else {}
    from_date_str = data.get('fromDate')
    to_date_str = data.get('toDate')

    from_date = datetime.fromisoformat(from_date_str.replace('Z', '+00:00')).replace(tzinfo=None) if from_date_str else None
    to_date = datetime.fromisoformat(to_date_str.replace('Z', '+00:00')).replace(tzinfo=None) if to_date_str else None

    logger.info(f"[API] /orders/history — from={from_date_str}, to={to_date_str}")
    orders = connector.get_order_history(from_date, to_date)

    return jsonify({
        "success": True,
        "orders": orders,
        "count": len(orders),
    }), 200


# ─── POST /price-history ─────────────────────────────────────────────
@app.route('/price-history', methods=['POST'])
def price_history():
    """
    [H-NEW-5] Get OHLC price bars.
    Request: { "symbol": "EURUSD", "timeframe": "H1", "fromDate": "...", "toDate": "...", "count": 500 }
    """
    auth_error = validate_api_key()
    if auth_error:
        return auth_error

    if not connector.connected:
        return jsonify({"success": False, "errorCode": "NOT_CONNECTED",
                        "message": "No MT5 session active."}), 400

    if not request.is_json:
        return jsonify({"success": False, "message": "Request must be JSON"}), 400

    data = request.get_json()
    symbol = data.get('symbol')
    if not symbol:
        return jsonify({"success": False, "message": "Missing 'symbol' parameter"}), 400

    # Parse timeframe
    tf_str = data.get('timeframe', 'H1').upper()
    timeframe = _parse_timeframe(tf_str)

    from_date_str = data.get('fromDate')
    to_date_str = data.get('toDate')
    count = data.get('count', 500)

    from_date = datetime.fromisoformat(from_date_str.replace('Z', '+00:00')).replace(tzinfo=None) if from_date_str else None
    to_date = datetime.fromisoformat(to_date_str.replace('Z', '+00:00')).replace(tzinfo=None) if to_date_str else None

    logger.info(f"[API] /price-history — symbol={symbol}, tf={tf_str}, count={count}")
    bars = connector.get_price_history(symbol, timeframe, from_date, to_date, count)

    return jsonify({
        "success": True,
        "symbol": symbol,
        "timeframe": tf_str,
        "bars": bars,
        "count": len(bars),
    }), 200


# ─── POST /ticks ─────────────────────────────────────────────────────
@app.route('/ticks', methods=['POST'])
def ticks():
    """
    [H-NEW-6] Get tick data.
    Request: { "symbol": "EURUSD", "count": 1000 }
    """
    auth_error = validate_api_key()
    if auth_error:
        return auth_error

    if not connector.connected:
        return jsonify({"success": False, "errorCode": "NOT_CONNECTED",
                        "message": "No MT5 session active."}), 400

    if not request.is_json:
        return jsonify({"success": False, "message": "Request must be JSON"}), 400

    data = request.get_json()
    symbol = data.get('symbol')
    if not symbol:
        return jsonify({"success": False, "message": "Missing 'symbol' parameter"}), 400

    count = data.get('count', 1000)

    logger.info(f"[API] /ticks — symbol={symbol}, count={count}")
    tick_data = connector.get_tick_data(symbol, count=count)

    return jsonify({
        "success": True,
        "symbol": symbol,
        "ticks": tick_data,
        "count": len(tick_data),
    }), 200


# ─── GET /terminal ───────────────────────────────────────────────────
@app.route('/terminal', methods=['GET'])
def terminal():
    """
    [H-NEW-7] Get MT5 terminal information.
    """
    auth_error = validate_api_key()
    if auth_error:
        return auth_error

    if not connector.connected:
        return jsonify({"success": False, "errorCode": "NOT_CONNECTED",
                        "message": "No MT5 session active."}), 400

    logger.info("[API] /terminal")
    info = connector.get_terminal_info()
    return jsonify({"success": True, "terminal": info}), 200


# ─── GET /positions ──────────────────────────────────────────────────
@app.route('/positions', methods=['GET'])
def positions():
    """Get currently open positions."""
    auth_error = validate_api_key()
    if auth_error:
        return auth_error

    if not connector.connected:
        return jsonify({"success": False, "errorCode": "NOT_CONNECTED",
                        "message": "No MT5 session active."}), 400

    logger.info("[API] /positions")
    pos = connector.get_open_positions()
    return jsonify({
        "success": True,
        "positions": pos,
        "count": len(pos),
    }), 200


# ─── GET /performance ────────────────────────────────────────────────
@app.route('/performance', methods=['POST'])
def performance():
    """
    [H-NEW-8] Get all performance metrics (Sharpe, PF, MDD, etc.).
    Request: { "accountId": ..., "server": ..., "password": ..., "fromDate": "..." }
    """
    from performance_calculator import PerformanceCalculator

    auth_error = validate_api_key()
    if auth_error:
        return auth_error

    if not request.is_json:
        return jsonify({"success": False, "message": "Request must be JSON"}), 400

    data = request.get_json()
    account_id = data.get('accountId')
    server = data.get('server')
    password = data.get('password')
    from_date_str = data.get('fromDate')

    if not all([account_id, server, password]):
        return jsonify({"success": False, "message": "Missing credentials"}), 400

    # Ensure connected
    conn_result = connector.connect(int(account_id), password, server)
    if not conn_result.get("connected"):
        response, status = build_connect_response(conn_result)
        return jsonify(response), status

    from_date = datetime.fromisoformat(from_date_str.replace('Z', '+00:00')).replace(tzinfo=None) if from_date_str else None

    logger.info(f"[API] /performance — account={account_id}")
    trades_data = connector.get_trade_history(from_date, None)
    metrics = PerformanceCalculator.calculate_all(trades_data)

    return jsonify({
        "success": True,
        "performance": metrics,
        "tradesAnalyzed": len(trades_data),
    }), 200


# ─── POST /full-sync-v2 ─────────────────────────────────────────────
@app.route('/full-sync-v2', methods=['POST'])
def full_sync_v2():
    """
    Enhanced sync — returns EVERYTHING: account (full), trades, positions,
    pending orders, performance metrics, terminal info.

    Request: { "accountId": ..., "server": ..., "password": ..., "fromDate": "..." }
    """
    auth_error = validate_api_key()
    if auth_error:
        return auth_error

    if not request.is_json:
        return jsonify({"success": False, "message": "Request must be JSON"}), 400

    data = request.get_json()
    account_id = data.get('accountId')
    server = data.get('server')
    password = data.get('password')
    from_date_str = data.get('fromDate')

    if not all([account_id, server, password]):
        return jsonify({"success": False, "message": "Missing credentials"}), 400

    # Ensure connected
    conn_result = connector.connect(int(account_id), password, server)
    if not conn_result.get("connected"):
        response, status = build_connect_response(conn_result)
        return jsonify(response), status

    from_date = datetime.fromisoformat(from_date_str.replace('Z', '+00:00')).replace(tzinfo=None) if from_date_str else None

    logger.info(f"[API] /full-sync-v2 — account={account_id}")
    try:
        sync_data = connector.full_sync_v2(from_date)
        return jsonify({"success": True, **sync_data}), 200
    except Exception as e:
        logger.error(f"[API] /full-sync-v2 — ERROR: {e}", exc_info=True)
        return jsonify({"success": False, "errorCode": "MT5_DATA_FETCH_FAILED",
                        "message": str(e)}), 502


# ─── Helper: Parse timeframe string ──────────────────────────────────
def _parse_timeframe(tf_str: str) -> int:
    """Convert timeframe string to MT5 constant."""
    import MetaTrader5 as mt5
    mapping = {
        'M1': mt5.TIMEFRAME_M1, 'M5': mt5.TIMEFRAME_M5,
        'M15': mt5.TIMEFRAME_M15, 'M30': mt5.TIMEFRAME_M30,
        'H1': mt5.TIMEFRAME_H1, 'H4': mt5.TIMEFRAME_H4,
        'D1': mt5.TIMEFRAME_D1, 'W1': mt5.TIMEFRAME_W1,
        'MN1': mt5.TIMEFRAME_MN1,
    }
    return mapping.get(tf_str, mt5.TIMEFRAME_H1)


# ─── Main ─────────────────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.getenv('MT5_SERVICE_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    logger.info(f"Starting MT5 Service v2 on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)

