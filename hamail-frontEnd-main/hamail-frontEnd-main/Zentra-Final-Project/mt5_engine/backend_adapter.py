"""
Backend Adapter Module — Phase H7

Transforms Python MT5 Engine output (snake_case) into the format
expected by the Node.js Backend (camelCase) as defined in:
  - INTEGRATION_GUIDE.md (Dũng)
  - trade.model.js schema
  - errorCodes.js

Also handles:
  - Session detection from entryTime (LONDON/NY/ASIA)
  - stopLossHit derivation
  - Error code prefixing (MT5_*)

Author: Hoà (MT5 Engine Lead)
"""
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

# ─── Trading Session Detection ────────────────────────────────────────
# Based on INTEGRATION_GUIDE.md:
#   ASIA:   01:00 - 09:00 UTC
#   LONDON: 09:00 - 17:00 UTC  (adjusted from guide's 14:00-22:00)
#   NY:     13:00 - 22:00 UTC
# If overlapping, priority: NY > LONDON > ASIA

def detect_session(entry_time_iso: str) -> str:
    """
    Detect trading session from entry time.

    Args:
        entry_time_iso: ISO 8601 UTC string like "2026-04-18T10:30:00Z"

    Returns:
        "LONDON", "NY", or "ASIA"
    """
    try:
        # Parse hour from ISO string
        time_part = entry_time_iso.split("T")[1] if "T" in entry_time_iso else "12:00:00Z"
        hour = int(time_part.split(":")[0])

        if 13 <= hour < 22:
            return "NY"
        elif 9 <= hour < 17:
            return "LONDON"
        elif 1 <= hour < 9:
            return "ASIA"
        else:
            return "NY"  # Default: late evening = NY close
    except Exception:
        return "LONDON"  # Safe default


def detect_stop_loss_hit(trade: Dict) -> bool:
    """
    Determine if stop loss was hit based on close price and SL level.

    Args:
        trade: Trade dict with snake_case keys from DataNormalizer

    Returns:
        True if SL was likely hit
    """
    sl = trade.get("stop_loss")
    close = trade.get("close_price", 0)
    trade_type = trade.get("trade_type", "")

    if sl is None or sl == 0 or close == 0:
        return False

    # For BUY: SL hit if close_price <= stop_loss
    # For SELL: SL hit if close_price >= stop_loss
    tolerance = 0.0001  # 0.1 pip tolerance for floating point
    if trade_type == "BUY":
        return close <= (sl + tolerance)
    elif trade_type == "SELL":
        return close >= (sl - tolerance)
    return False


# ─── Error Code Mapping ───────────────────────────────────────────────
# Maps Python internal error codes → Backend MT5_* error codes
ERROR_CODE_MAP = {
    "INVALID_CREDENTIALS": "MT5_INVALID_CREDENTIALS",
    "SERVER_UNREACHABLE": "MT5_SERVER_UNREACHABLE",
    "CONNECTION_TIMEOUT": "MT5_CONNECTION_TIMEOUT",
    "MT5_NOT_INITIALIZED": "MT5_NOT_INITIALIZED",
    "PERMISSION_DENIED": "MT5_PERMISSION_DENIED",
    "NO_TRADE_HISTORY": "MT5_NO_TRADE_HISTORY",
    "SYSTEM_ERROR": "MT5_DATA_FETCH_FAILED",
}

# HTTP status for each error code
ERROR_HTTP_STATUS = {
    "MT5_INVALID_CREDENTIALS": 401,
    "MT5_SERVER_UNREACHABLE": 502,
    "MT5_CONNECTION_TIMEOUT": 504,
    "MT5_NOT_INITIALIZED": 500,
    "MT5_PERMISSION_DENIED": 403,
    "MT5_NO_TRADE_HISTORY": 404,
    "MT5_DATA_FETCH_FAILED": 502,
    "MT5_TERMINAL_NOT_FOUND": 500,
    "MT5_SERVICE_UNAVAILABLE": 503,
}


def map_error_code(python_code: str) -> str:
    """Map Python error code to Backend MT5_* error code."""
    # Already prefixed
    if python_code.startswith("MT5_"):
        return python_code
    return ERROR_CODE_MAP.get(python_code, "MT5_DATA_FETCH_FAILED")


def get_error_http_status(error_code: str) -> int:
    """Get HTTP status code for an error code."""
    return ERROR_HTTP_STATUS.get(error_code, 500)


# ─── Trade Adapter: snake_case → camelCase ────────────────────────────

def adapt_trade_for_backend(trade: Dict) -> Dict:
    """
    Transform a single trade from Python CONTRACT format (snake_case)
    to Backend INTEGRATION_GUIDE format (camelCase).

    Adds derived fields: session, stopLossHit, exitedEarly, mt5DealId, mt5Symbol.

    Args:
        trade: Dict with snake_case keys from DataNormalizer

    Returns:
        Dict with camelCase keys matching trade.model.js schema
    """
    session = detect_session(trade.get("open_time", ""))
    sl_hit = detect_stop_loss_hit(trade)

    adapted = {
        "ticket": trade.get("ticket"),
        "orderId": trade.get("order_id"),
        "dealInId": trade.get("deal_in_id"),
        "dealOutId": trade.get("deal_out_id"),
        "positionId": trade.get("position_id"),
        "mt5Symbol": trade.get("symbol"),
        "mt5DealId": trade.get("deal_out_id"),  # Backend uses dealOutId as mt5DealId
        "tradeType": trade.get("trade_type"),
        "volume": trade.get("volume"),
        "openPrice": trade.get("open_price"),
        "closePrice": trade.get("close_price"),
        "stopLoss": trade.get("stop_loss"),
        "takeProfit": trade.get("take_profit"),
        "entryTime": trade.get("open_time"),
        "exitTime": trade.get("close_time"),
        "profitLoss": trade.get("profit"),
        "commission": trade.get("commission"),
        "swap": trade.get("swap"),
        "netProfit": trade.get("net_profit"),
        "magicNumber": trade.get("magic_number", 0),
        "durationSeconds": trade.get("duration_seconds"),
        # Derived fields
        "session": session,
        "stopLossHit": sl_hit,
        "exitedEarly": not sl_hit and trade.get("net_profit", 0) < 0,
        # These fields are null for MT5 imports (psychology features)
        "riskPercentUsed": None,
        "riskRewardAchieved": None,
        "targetPercentAchieved": None,
        "notes": trade.get("comment", ""),
    }

    logger.debug(f"[ADAPTER] Trade {adapted['ticket']}: "
                 f"{adapted['tradeType']} {adapted['mt5Symbol']} "
                 f"session={adapted['session']} slHit={adapted['stopLossHit']}")
    return adapted


def adapt_trades_for_backend(trades: List[Dict]) -> List[Dict]:
    """Transform a list of trades from Python format to Backend format."""
    logger.info(f"[ADAPTER] Adapting {len(trades)} trades for backend")
    return [adapt_trade_for_backend(t) for t in trades]


def adapt_account_for_backend(account: Dict) -> Dict:
    """Transform account info from Python format to Backend format."""
    return {
        "accountId": str(account.get("account_id", "")),
        "server": account.get("broker_server", ""),
        "balance": account.get("balance", 0),
        "equity": account.get("equity", 0),
        "currency": account.get("currency", "USD"),
        "leverage": account.get("leverage"),
        "margin": account.get("margin", 0),
        "company": account.get("company", ""),
        "name": account.get("name", ""),
    }


def adapt_position_for_backend(position: Dict) -> Dict:
    """Transform an open position from Python format to Backend format."""
    return {
        "ticket": position.get("ticket"),
        "symbol": position.get("symbol"),
        "tradeType": position.get("trade_type"),
        "volume": position.get("volume"),
        "openPrice": position.get("open_price"),
        "currentPrice": position.get("current_price"),
        "stopLoss": position.get("stop_loss"),
        "takeProfit": position.get("take_profit"),
        "openTime": position.get("open_time"),
        "floatingProfit": position.get("floating_profit"),
        "commission": position.get("commission", 0),
        "swap": position.get("swap", 0),
    }


def adapt_positions_for_backend(positions: List[Dict]) -> List[Dict]:
    """Transform a list of positions from Python format to Backend format."""
    return [adapt_position_for_backend(p) for p in positions]


# ─── Full Response Builders ───────────────────────────────────────────

def build_connect_response(connector_result: Dict) -> tuple:
    """
    Build Flask response for /connect endpoint.

    Returns:
        Tuple of (response_dict, http_status)
    """
    if connector_result.get("connected"):
        account = connector_result.get("account_info", {})
        return {
            "success": True,
            "accountId": str(account.get("account_id", "")),
            "server": account.get("broker_server", ""),
            "balance": account.get("balance", 0),
            "equity": account.get("equity", 0),
            "margin": account.get("margin", 0),
            "currency": account.get("currency", "USD"),
        }, 200
    else:
        error = connector_result.get("error", {})
        raw_code = error.get("code", "SYSTEM_ERROR") if isinstance(error, dict) else "SYSTEM_ERROR"
        message = error.get("message", str(error)) if isinstance(error, dict) else str(error)
        mt5_code = map_error_code(raw_code)
        return {
            "success": False,
            "errorCode": mt5_code,
            "message": message,
            "statusCode": get_error_http_status(mt5_code),
        }, get_error_http_status(mt5_code)


def build_trades_response(trades: List[Dict], count: int = None) -> tuple:
    """
    Build Flask response for /trades endpoint.

    Returns:
        Tuple of (response_dict, http_status)
    """
    adapted = adapt_trades_for_backend(trades)
    return {
        "success": True,
        "trades": adapted,
        "count": count if count is not None else len(adapted),
    }, 200


def build_sync_response(sync_data: Dict) -> tuple:
    """
    Build Flask response for /sync endpoint.

    Returns:
        Tuple of (response_dict, http_status)
    """
    trades = sync_data.get("trades", [])
    positions = sync_data.get("open_positions", [])
    account = sync_data.get("account", {})

    adapted_trades = adapt_trades_for_backend(trades)
    adapted_positions = adapt_positions_for_backend(positions)
    adapted_account = adapt_account_for_backend(account)

    return {
        "success": True,
        "trades": adapted_trades,
        "openPositions": adapted_positions,
        "accountInfo": adapted_account,
        "summary": sync_data.get("daily_summary", {}),
        "syncTimeMs": sync_data.get("sync_time_ms", 0),
        "totalTradesFetched": len(adapted_trades),
        "count": len(adapted_trades),
    }, 200
