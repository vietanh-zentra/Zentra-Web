"""
MT5 Connector Module — Phase H2

Manages all MetaTrader5 connections: initialize, login, disconnect,
account info retrieval, trade history extraction, and full sync.

Author: Hoà (MT5 Engine Lead)
"""
import os
import time
import logging
from datetime import datetime, timedelta
import MetaTrader5 as mt5
from typing import Dict, List, Any, Optional
from mt5_automation import ensure_account_logged_in, check_account_logged_in
from data_normalizer import DataNormalizer

logger = logging.getLogger(__name__)

# Default MT5 path - Windows
DEFAULT_MT5_PATH = 'C:\\Program Files\\MetaTrader 5\\terminal64.exe'
MT5_PATH = os.getenv('MT5_PATH', DEFAULT_MT5_PATH)

# Connection constants
CONNECTION_TIMEOUT_MS = 30000  # 30 seconds as per spec
MAX_RECONNECT_ATTEMPTS = 3
RECONNECT_DELAY_SECONDS = 2


class MT5Connector:
    """
    Core MT5 connection manager.
    Handles: connect, disconnect, get_account_info, get_trade_history,
    get_open_positions, full_sync.

    Usage:
        connector = MT5Connector(login=5049421223, password="xxx", server="MetaQuotes-Demo")
        result = connector.connect()
        trades = connector.get_trade_history(from_date, to_date)
        connector.disconnect()
    """

    def __init__(self, login: int = None, password: str = None, server: str = None):
        """
        Initialize connector with optional credentials.

        Args:
            login: MT5 account ID (integer)
            password: MT5 password (investor password recommended)
            server: MT5 broker server name
        """
        self.login = login
        self.password = password
        self.server = server
        self.connected = False
        self._connection_time_ms = 0
        logger.info(f"MT5Connector initialized. Login={login}, Server={server}")

    def connect(self, account_id: int = None, password: str = None,
                server: str = None, manual_login: bool = False) -> Dict:
        """
        Connect to MT5 server. Returns account_info or error with standard error codes.

        Args:
            account_id: Override login from __init__
            password: Override password from __init__
            server: Override server from __init__
            manual_login: If True, attempt UI automation for first-time login

        Returns:
            Dict with 'connected' bool and 'account_info' or 'error'
        """
        # Use params from __init__ if not overridden
        account_id = account_id or self.login
        password = password or self.password
        server = server or self.server

        if not account_id or not password or not server:
            logger.error("connect() called without credentials and no __init__ credentials set")
            return {"connected": False, "error": {"code": "INVALID_CREDENTIALS",
                    "message": "Missing account_id, password, or server"}}

        # Check if already connected to this account
        if self.connected and check_account_logged_in(account_id):
            logger.info(f"Account {account_id} already connected, reusing session")
            return {"connected": True, "account_info": self.get_account_info()}

        logger.info(f"[CONNECT] Starting connection for account {account_id} @ {server}")
        logger.info(f"[CONNECT] Manual login: {manual_login}")
        logger.info(f"[CONNECT] MT5 path: {MT5_PATH}, exists: {os.path.exists(MT5_PATH)}")

        start_time = time.time()

        try:
            # Attempt 1: Direct initialization
            logger.info("[CONNECT] Step 1: Attempting direct mt5.initialize()")
            if mt5.initialize(path=MT5_PATH, login=account_id, password=password,
                              server=server, timeout=CONNECTION_TIMEOUT_MS, portable=False):
                if check_account_logged_in(account_id):
                    self.connected = True
                    self._connection_time_ms = int((time.time() - start_time) * 1000)
                    logger.info(f"[CONNECT] Direct login SUCCESS in {self._connection_time_ms}ms")
                    return {"connected": True, "account_info": self.get_account_info()}
                else:
                    logger.warning("[CONNECT] mt5.initialize() returned True but account not logged in. Retrying...")
                    mt5.shutdown()

            # Attempt 2: UI automation (if requested)
            if manual_login:
                logger.info("[CONNECT] Step 2: Attempting automated UI login")
                auto_success, auto_err = ensure_account_logged_in(
                    account_id, password, server, MT5_PATH, use_automation=True
                )
                if auto_success:
                    logger.info("[CONNECT] UI automation completed, verifying login...")
                    time.sleep(2)
                    if mt5.initialize(path=MT5_PATH, login=account_id, password=password,
                                      server=server, timeout=CONNECTION_TIMEOUT_MS, portable=False):
                        if check_account_logged_in(account_id):
                            self.connected = True
                            self._connection_time_ms = int((time.time() - start_time) * 1000)
                            logger.info(f"[CONNECT] Automation login SUCCESS in {self._connection_time_ms}ms")
                            return {"connected": True, "account_info": self.get_account_info()}
                    error_code = mt5.last_error()
                    logger.error(f"[CONNECT] Post-automation init failed: {error_code}")
                    return {"connected": False, "error": {"code": "MT5_NOT_INITIALIZED",
                            "message": f"MT5 init failed after automation: {error_code}"}}
                else:
                    logger.warning(f"[CONNECT] UI automation failed: {auto_err}")

            # Attempt 3: Retry direct initialization with reconnect logic
            for attempt in range(1, MAX_RECONNECT_ATTEMPTS + 1):
                logger.info(f"[CONNECT] Step 3: Retry attempt {attempt}/{MAX_RECONNECT_ATTEMPTS}")
                try:
                    mt5.shutdown()
                except Exception:
                    pass
                time.sleep(RECONNECT_DELAY_SECONDS)

                if mt5.initialize(path=MT5_PATH, login=account_id, password=password,
                                  server=server, timeout=CONNECTION_TIMEOUT_MS, portable=False):
                    account_info = mt5.account_info()
                    if account_info and account_info.login == account_id:
                        self.connected = True
                        self._connection_time_ms = int((time.time() - start_time) * 1000)
                        logger.info(f"[CONNECT] Retry #{attempt} SUCCESS in {self._connection_time_ms}ms")
                        return {"connected": True, "account_info": self.get_account_info()}

            # All attempts failed — determine error type
            error_code = mt5.last_error()
            total_time = int((time.time() - start_time) * 1000)
            logger.error(f"[CONNECT] ALL ATTEMPTS FAILED after {total_time}ms. Last error: {error_code}")

            if error_code and error_code[0] == -10005:
                return {"connected": False, "error": {"code": "CONNECTION_TIMEOUT",
                        "message": f"Connection timed out after {total_time}ms. Error: {error_code}"}}
            elif error_code and error_code[0] == -10004:
                return {"connected": False, "error": {"code": "INVALID_CREDENTIALS",
                        "message": f"Invalid login, password, or server. Error: {error_code}"}}
            elif error_code and error_code[0] in (-10003, -10001):
                return {"connected": False, "error": {"code": "MT5_NOT_INITIALIZED",
                        "message": f"MT5 terminal could not be launched. Error: {error_code}"}}
            else:
                return {"connected": False, "error": {"code": "SERVER_UNREACHABLE",
                        "message": f"Could not reach MT5 server. Error: {error_code}"}}

        except Exception as e:
            logger.error(f"[CONNECT] EXCEPTION: {str(e)}", exc_info=True)
            return {"connected": False, "error": {"code": "SYSTEM_ERROR",
                    "message": str(e)}}

    def disconnect(self):
        """Safely close the MT5 connection."""
        logger.info("[DISCONNECT] Shutting down MT5 connection")
        try:
            mt5.shutdown()
        except Exception as e:
            logger.warning(f"[DISCONNECT] Error during shutdown: {e}")
        self.connected = False
        logger.info("[DISCONNECT] Connection closed")

    def get_account_info(self) -> Dict:
        """
        Get current account information in CONTRACT.md format.

        Returns:
            Dict matching CONTRACT.md Section 4.1 schema
        """
        logger.info("[ACCOUNT_INFO] Fetching account info")
        account_info = mt5.account_info()
        if not account_info:
            logger.error("[ACCOUNT_INFO] mt5.account_info() returned None")
            return {}

        result = {
            "account_id": account_info.login,
            "broker_server": account_info.server,
            "company": account_info.company,
            "name": getattr(account_info, 'name', 'Demo Account'),
            "balance": round(account_info.balance, 2),
            "equity": round(account_info.equity, 2),
            "margin": round(account_info.margin, 2),
            "free_margin": round(account_info.margin_free, 2),
            "margin_level": round(account_info.margin_level, 2),
            "currency": account_info.currency,
            "leverage": account_info.leverage,
            "connected": True,
            "connection_time_ms": self._connection_time_ms,
            "last_sync": datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
        }
        logger.info(f"[ACCOUNT_INFO] Account {result['account_id']}: "
                     f"Balance={result['balance']} {result['currency']}, "
                     f"Equity={result['equity']}, Leverage={result['leverage']}")
        return result

    def get_trade_history(self, from_date: Optional[datetime] = None,
                          to_date: Optional[datetime] = None) -> List[Dict]:
        """
        Fetch closed trade history, normalized to CONTRACT.md format.

        Args:
            from_date: Start date (defaults to 365 days ago)
            to_date: End date (defaults to now)

        Returns:
            List of trade dicts matching CONTRACT.md Section 4.2 schema
        """
        if not from_date:
            from_date = datetime.utcnow() - timedelta(days=365)
        if not to_date:
            to_date = datetime.utcnow() + timedelta(days=1)  # Buffer for timezone diff

        logger.info(f"[TRADE_HISTORY] Fetching deals from {from_date.isoformat()} to {to_date.isoformat()}")

        # Pass datetime objects directly — MT5 handles timezone conversion internally
        deals = mt5.history_deals_get(from_date, to_date)
        if not deals:
            logger.info("[TRADE_HISTORY] No deals found in date range")
            return []

        logger.info(f"[TRADE_HISTORY] Raw deals from MT5: {len(deals)}")

        # Use DataNormalizer to pair deals and transform
        paired_trades = DataNormalizer.pair_open_close_deals(deals)
        logger.info(f"[TRADE_HISTORY] Paired into {len(paired_trades)} complete trades")

        result = []
        for pid, data in paired_trades.items():
            trade_json = DataNormalizer.transform_to_contract(pid, data)
            result.append(trade_json)

        logger.info(f"[TRADE_HISTORY] Normalized {len(result)} trades to CONTRACT format")
        return result

    def get_open_positions(self) -> List[Dict]:
        """
        Fetch currently open positions, normalized to CONTRACT.md format.

        Returns:
            List of position dicts matching CONTRACT.md Section 4.3 schema
        """
        logger.info("[POSITIONS] Fetching open positions")
        positions = mt5.positions_get()
        result = DataNormalizer.normalize_positions(positions)
        logger.info(f"[POSITIONS] Found {len(result)} open positions")
        return result

    def full_sync(self, from_date: Optional[datetime] = None) -> Dict:
        """
        Full data synchronization: account + trades + positions + summary.
        Designed for the POST /api/v1/accounts/:id/sync endpoint.

        Args:
            from_date: Start date for trade history (defaults to 365 days ago)

        Returns:
            Dict with account, trades, open_positions, daily_summary, sync_time_ms
        """
        logger.info("[FULL_SYNC] Starting full synchronization")
        start_time = datetime.now()

        account = self.get_account_info()
        trades = self.get_trade_history(from_date, None)
        positions = self.get_open_positions()

        # Compute daily summary
        total_profit = sum(t["profit"] for t in trades)
        total_commission = sum(t["commission"] for t in trades)
        total_swap = sum(t["swap"] for t in trades)
        net_profit = sum(t["net_profit"] for t in trades)
        wins = sum(1 for t in trades if t["net_profit"] > 0)
        losses = sum(1 for t in trades if t["net_profit"] <= 0)

        summary = {
            "total_trades": len(trades),
            "winning_trades": wins,
            "losing_trades": losses,
            "total_profit": round(total_profit, 2),
            "total_commission": round(total_commission, 2),
            "total_swap": round(total_swap, 2),
            "net_profit": round(net_profit, 2)
        }

        sync_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)

        logger.info(f"[FULL_SYNC] Complete: {len(trades)} trades, "
                     f"{len(positions)} positions, net_profit={net_profit:.2f}, "
                     f"sync_time={sync_time_ms}ms")

        return {
            "account": account,
            "trades": trades,
            "open_positions": positions,
            "daily_summary": summary,
            "sync_time_ms": sync_time_ms,
            "total_trades_fetched": len(trades)
        }
