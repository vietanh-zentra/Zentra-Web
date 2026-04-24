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
        Connect to MT5 server. Uses path-only initialization to reuse
        the terminal's existing session, avoiding IPC disconnection.

        Args:
            account_id: Override login from __init__
            password: Override password from __init__
            server: Override server from __init__
            manual_login: Ignored (kept for API compatibility)

        Returns:
            Dict with 'connected' bool and 'account_info' or 'error'
        """
        account_id = account_id or self.login
        password = password or self.password
        server = server or self.server

        if not account_id or not password or not server:
            logger.error("connect() called without credentials")
            return {"connected": False, "error": {"code": "INVALID_CREDENTIALS",
                    "message": "Missing account_id, password, or server"}}

        # Check if already connected to this account
        if self.connected:
            try:
                info = mt5.account_info()
                if info and info.login == int(account_id):
                    logger.info(f"Account {account_id} already connected, reusing session")
                    return {"connected": True, "account_info": self.get_account_info()}
            except Exception:
                pass

        logger.info(f"[CONNECT] Starting connection for account {account_id} @ {server}")
        logger.info(f"[CONNECT] MT5 path: {MT5_PATH}, exists: {os.path.exists(MT5_PATH)}")

        start_time = time.time()

        try:
            # Clean any stale connection
            try:
                mt5.shutdown()
            except Exception:
                pass
            time.sleep(0.5)

            # Step 1: Initialize with PATH ONLY (reuse terminal session)
            logger.info("[CONNECT] Step 1: mt5.initialize(path only)")
            if not mt5.initialize(path=MT5_PATH):
                error_code = mt5.last_error()
                logger.error(f"[CONNECT] mt5.initialize() failed: {error_code}")
                return {"connected": False, "error": {"code": "MT5_NOT_INITIALIZED",
                        "message": f"MT5 terminal init failed: {error_code}"}}

            # Step 2: Check if the right account is already logged in
            info = mt5.account_info()
            if info and info.login == int(account_id):
                self.connected = True
                self._connection_time_ms = int((time.time() - start_time) * 1000)
                logger.info(f"[CONNECT] SUCCESS (reused session) in {self._connection_time_ms}ms")
                return {"connected": True, "account_info": self.get_account_info()}

            # Step 3: Different account — use mt5.login() (does NOT restart terminal)
            logger.info(f"[CONNECT] Terminal has different account, attempting mt5.login()")
            if mt5.login(int(account_id), password=password, server=server,
                         timeout=CONNECTION_TIMEOUT_MS):
                self.connected = True
                self._connection_time_ms = int((time.time() - start_time) * 1000)
                logger.info(f"[CONNECT] SUCCESS (mt5.login) in {self._connection_time_ms}ms")
                return {"connected": True, "account_info": self.get_account_info()}

            # Login failed
            error_code = mt5.last_error()
            total_time = int((time.time() - start_time) * 1000)
            logger.error(f"[CONNECT] mt5.login() failed after {total_time}ms: {error_code}")

            if error_code and error_code[0] == -10004:
                return {"connected": False, "error": {"code": "INVALID_CREDENTIALS",
                        "message": f"Invalid login, password, or server. Error: {error_code}"}}
            else:
                return {"connected": False, "error": {"code": "CONNECTION_TIMEOUT",
                        "message": f"Connection failed after {total_time}ms. Error: {error_code}"}}

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

        # Fetch ALL orders in the same date range to prevent N+1 query problem
        orders = mt5.history_orders_get(from_date, to_date)
        orders_dict = {o.ticket: o for o in orders} if orders else {}

        # Use DataNormalizer to pair deals and transform
        paired_trades = DataNormalizer.pair_open_close_deals(deals)
        logger.info(f"[TRADE_HISTORY] Paired into {len(paired_trades)} complete trades")

        result = []
        for pid, data in paired_trades.items():
            trade_json = DataNormalizer.transform_to_contract(pid, data, orders_dict)
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

    # ────────────────────────────────────────────────────────────────────
    # NEW METHODS — Phase H-NEW-1 to H-NEW-7
    # ────────────────────────────────────────────────────────────────────

    def get_account_info_full(self) -> Dict:
        """
        [H-NEW-1] Get ALL ~40 fields from mt5.account_info().

        Returns:
            Dict with comprehensive account data including margin levels,
            trade mode, limits, and permissions.
        """
        logger.info("[ACCOUNT_FULL] Fetching full account info")
        info = mt5.account_info()
        if not info:
            logger.error("[ACCOUNT_FULL] mt5.account_info() returned None")
            return {}

        # Map ALL available fields
        result = {
            # Identity
            "login": info.login,
            "name": getattr(info, 'name', ''),
            "server": info.server,
            "company": info.company,
            "currency": info.currency,
            "leverage": info.leverage,

            # Balance & Equity
            "balance": round(info.balance, 2),
            "equity": round(info.equity, 2),
            "profit": round(info.profit, 2),
            "credit": round(getattr(info, 'credit', 0.0), 2),
            "assets": round(getattr(info, 'assets', 0.0), 2),
            "liabilities": round(getattr(info, 'liabilities', 0.0), 2),

            # Margin
            "margin": round(info.margin, 2),
            "marginFree": round(info.margin_free, 2),
            "marginLevel": round(info.margin_level, 2),
            "marginInitial": round(getattr(info, 'margin_initial', 0.0), 2),
            "marginMaintenance": round(getattr(info, 'margin_maintenance', 0.0), 2),
            "marginSoCall": round(getattr(info, 'margin_so_call', 0.0), 2),
            "marginSoSo": round(getattr(info, 'margin_so_so', 0.0), 2),
            "marginSoMode": getattr(info, 'margin_so_mode', 0),
            "commissionBlocked": round(getattr(info, 'commission_blocked', 0.0), 2),

            # Account Type & Permissions
            "tradeMode": getattr(info, 'trade_mode', 0),
            "tradeModeDescription": self._trade_mode_name(getattr(info, 'trade_mode', 0)),
            "tradeAllowed": bool(getattr(info, 'trade_allowed', False)),
            "tradeExpert": bool(getattr(info, 'trade_expert', False)),
            "fifoClose": bool(getattr(info, 'fifo_close', False)),
            "limitOrders": getattr(info, 'limit_orders', 0),

            # Connection
            "connected": True,
            "connectionTimeMs": self._connection_time_ms,
            "lastSync": datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
        }

        logger.info(f"[ACCOUNT_FULL] {result['login']}: "
                     f"Balance={result['balance']} {result['currency']}, "
                     f"Mode={result['tradeModeDescription']}, "
                     f"MarginLevel={result['marginLevel']}%")
        return result

    @staticmethod
    def _trade_mode_name(mode: int) -> str:
        """Map trade_mode enum to human-readable string."""
        modes = {0: "Demo", 1: "Contest", 2: "Real"}
        return modes.get(mode, f"Unknown({mode})")

    def get_symbols_info(self, group: str = None) -> List[Dict]:
        """
        [H-NEW-2] Get all available symbols with market data.

        Args:
            group: Optional filter pattern (e.g., "*USD*", "Forex*")

        Returns:
            List of symbol dicts with bid/ask/spread/swap/contract info
        """
        logger.info(f"[SYMBOLS] Fetching symbols (group={group})")

        if group:
            symbols = mt5.symbols_get(group)
        else:
            # Get only visible (selected in MarketWatch) symbols
            symbols = mt5.symbols_get()

        if not symbols:
            logger.info("[SYMBOLS] No symbols found")
            return []

        result = []
        for s in symbols:
            result.append({
                "symbol": s.name,
                "description": getattr(s, 'description', ''),
                "path": getattr(s, 'path', ''),
                "currencyBase": getattr(s, 'currency_base', ''),
                "currencyProfit": getattr(s, 'currency_profit', ''),
                "currencyMargin": getattr(s, 'currency_margin', ''),

                # Pricing
                "bid": round(s.bid, s.digits) if s.bid else 0.0,
                "ask": round(s.ask, s.digits) if s.ask else 0.0,
                "last": round(getattr(s, 'last', 0.0), s.digits),
                "spread": s.spread,
                "spreadFloat": bool(getattr(s, 'spread_float', False)),
                "digits": s.digits,
                "point": s.point,

                # Volume
                "volumeMin": s.volume_min,
                "volumeMax": s.volume_max,
                "volumeStep": s.volume_step,
                "contractSize": s.trade_contract_size,

                # Tick
                "tradeTickValue": getattr(s, 'trade_tick_value', 0.0),
                "tradeTickSize": getattr(s, 'trade_tick_size', 0.0),

                # Swap
                "swapLong": getattr(s, 'swap_long', 0.0),
                "swapShort": getattr(s, 'swap_short', 0.0),
                "swapMode": getattr(s, 'swap_mode', 0),

                # Session
                "priceChange": round(getattr(s, 'price_change', 0.0), 2),
                "priceChangePercent": round(getattr(s, 'price_change_percent', 0.0), 4),
                "volumeReal": getattr(s, 'volume_real', 0.0),
                "tradeMode": getattr(s, 'trade_mode', 0),
                "visible": bool(getattr(s, 'visible', False)),
                "selected": bool(getattr(s, 'select', False)),
            })

        logger.info(f"[SYMBOLS] Returning {len(result)} symbols")
        return result

    def get_symbol_info(self, symbol_name: str) -> Optional[Dict]:
        """Get detailed info for a single symbol."""
        logger.info(f"[SYMBOL] Fetching info for {symbol_name}")
        info = mt5.symbol_info(symbol_name)
        if not info:
            logger.warning(f"[SYMBOL] {symbol_name} not found")
            return None

        # Use get_symbols_info logic for single symbol
        symbols = self.get_symbols_info()
        for s in symbols:
            if s["symbol"] == symbol_name:
                return s

        return None

    def get_pending_orders(self) -> List[Dict]:
        """
        [H-NEW-3] Get currently active pending orders.

        Returns:
            List of pending order dicts
        """
        logger.info("[ORDERS] Fetching pending orders")
        orders = mt5.orders_get()
        if not orders:
            logger.info("[ORDERS] No pending orders")
            return []

        result = []
        for o in orders:
            order_type = self._order_type_name(o.type)
            result.append({
                "ticket": o.ticket,
                "symbol": o.symbol,
                "type": o.type,
                "typeName": order_type,
                "volume": o.volume_current,
                "volumeInitial": o.volume_initial,
                "priceOpen": o.price_open,
                "priceCurrent": o.price_current,
                "stopLoss": o.sl if o.sl > 0 else None,
                "takeProfit": o.tp if o.tp > 0 else None,
                "timeSetup": datetime.utcfromtimestamp(o.time_setup).strftime('%Y-%m-%dT%H:%M:%SZ'),
                "timeExpiration": datetime.utcfromtimestamp(o.time_expiration).strftime('%Y-%m-%dT%H:%M:%SZ') if o.time_expiration > 0 else None,
                "state": o.state,
                "magic": o.magic,
                "comment": o.comment,
                "positionId": getattr(o, 'position_id', 0),
            })

        logger.info(f"[ORDERS] Found {len(result)} pending orders")
        return result

    @staticmethod
    def _order_type_name(order_type: int) -> str:
        """Map order type enum to string."""
        types = {
            0: "BUY", 1: "SELL",
            2: "BUY_LIMIT", 3: "SELL_LIMIT",
            4: "BUY_STOP", 5: "SELL_STOP",
            6: "BUY_STOP_LIMIT", 7: "SELL_STOP_LIMIT",
        }
        return types.get(order_type, f"UNKNOWN({order_type})")

    def get_order_history(self, from_date: Optional[datetime] = None,
                          to_date: Optional[datetime] = None) -> List[Dict]:
        """
        [H-NEW-4] Get historical orders (executed/cancelled/expired).

        Args:
            from_date: Start date (defaults to 365 days ago)
            to_date: End date (defaults to now)

        Returns:
            List of historical order dicts
        """
        if not from_date:
            from_date = datetime.utcnow() - timedelta(days=365)
        if not to_date:
            to_date = datetime.utcnow() + timedelta(days=1)

        logger.info(f"[ORDER_HISTORY] Fetching from {from_date} to {to_date}")
        orders = mt5.history_orders_get(from_date, to_date)

        if not orders:
            logger.info("[ORDER_HISTORY] No historical orders found")
            return []

        result = []
        for o in orders:
            result.append({
                "ticket": o.ticket,
                "symbol": o.symbol,
                "type": o.type,
                "typeName": self._order_type_name(o.type),
                "state": o.state,
                "volumeInitial": o.volume_initial,
                "volumeCurrent": o.volume_current,
                "priceOpen": o.price_open,
                "priceCurrent": getattr(o, 'price_current', 0.0),
                "priceStopLimit": getattr(o, 'price_stoplimit', 0.0),
                "stopLoss": o.sl if o.sl > 0 else None,
                "takeProfit": o.tp if o.tp > 0 else None,
                "timeSetup": datetime.utcfromtimestamp(o.time_setup).strftime('%Y-%m-%dT%H:%M:%SZ'),
                "timeDone": datetime.utcfromtimestamp(o.time_done).strftime('%Y-%m-%dT%H:%M:%SZ') if o.time_done > 0 else None,
                "timeExpiration": datetime.utcfromtimestamp(o.time_expiration).strftime('%Y-%m-%dT%H:%M:%SZ') if o.time_expiration > 0 else None,
                "magic": o.magic,
                "comment": o.comment,
                "positionId": o.position_id,
                "dealId": getattr(o, 'position_by_id', 0),
            })

        logger.info(f"[ORDER_HISTORY] Found {len(result)} historical orders")
        return result

    def get_price_history(self, symbol: str, timeframe: int = None,
                          from_date: Optional[datetime] = None,
                          to_date: Optional[datetime] = None,
                          count: int = 500) -> List[Dict]:
        """
        [H-NEW-5] Get OHLC price bars.

        Args:
            symbol: Symbol name (e.g., "EURUSD")
            timeframe: MT5 timeframe constant (default H1)
            from_date: Start date
            to_date: End date
            count: Max bars to return

        Returns:
            List of OHLC bar dicts
        """
        if timeframe is None:
            timeframe = mt5.TIMEFRAME_H1

        logger.info(f"[PRICE] Fetching {symbol} bars, tf={timeframe}, count={count}")

        if from_date and to_date:
            rates = mt5.copy_rates_range(symbol, timeframe, from_date, to_date)
        else:
            from_dt = from_date or datetime.utcnow()
            rates = mt5.copy_rates_from(symbol, timeframe, from_dt, count)

        if rates is None or len(rates) == 0:
            logger.info(f"[PRICE] No price data for {symbol}")
            return []

        result = []
        for r in rates:
            result.append({
                "time": datetime.utcfromtimestamp(r['time']).strftime('%Y-%m-%dT%H:%M:%SZ'),
                "timestamp": int(r['time']),
                "open": round(float(r['open']), 5),
                "high": round(float(r['high']), 5),
                "low": round(float(r['low']), 5),
                "close": round(float(r['close']), 5),
                "tickVolume": int(r['tick_volume']),
                "spread": int(r['spread']),
                "realVolume": int(r['real_volume']),
            })

        logger.info(f"[PRICE] Returning {len(result)} bars for {symbol}")
        return result

    def get_tick_data(self, symbol: str,
                      from_date: Optional[datetime] = None,
                      count: int = 1000) -> List[Dict]:
        """
        [H-NEW-6] Get tick-level data.

        Args:
            symbol: Symbol name
            from_date: Start date (defaults to now)
            count: Number of ticks

        Returns:
            List of tick dicts
        """
        logger.info(f"[TICKS] Fetching {count} ticks for {symbol}")

        from_dt = from_date or datetime.utcnow()
        ticks = mt5.copy_ticks_from(symbol, from_dt, count, mt5.COPY_TICKS_ALL)

        if ticks is None or len(ticks) == 0:
            logger.info(f"[TICKS] No tick data for {symbol}")
            return []

        result = []
        for t in ticks:
            result.append({
                "time": datetime.utcfromtimestamp(t['time']).strftime('%Y-%m-%dT%H:%M:%SZ'),
                "timestampMs": int(t['time_msc']),
                "bid": round(float(t['bid']), 5),
                "ask": round(float(t['ask']), 5),
                "last": round(float(t['last']), 5),
                "volume": int(t['volume']),
                "volumeReal": float(t['volume_real']),
                "flags": int(t['flags']),
            })

        logger.info(f"[TICKS] Returning {len(result)} ticks for {symbol}")
        return result

    def get_terminal_info(self) -> Dict:
        """
        [H-NEW-7] Get MT5 terminal information.

        Returns:
            Dict with terminal status, version, latency, etc.
        """
        logger.info("[TERMINAL] Fetching terminal info")
        info = mt5.terminal_info()
        if not info:
            logger.error("[TERMINAL] terminal_info() returned None")
            return {}

        result = {
            "connected": bool(info.connected),
            "tradeAllowed": bool(info.trade_allowed),
            "tradeExpertAllowed": bool(getattr(info, 'trade_expert', False)),
            "community": bool(getattr(info, 'community_account', False)),
            "communityConnection": bool(getattr(info, 'community_connection', False)),
            "pingLast": getattr(info, 'ping_last', 0),
            "company": info.company,
            "name": info.name,
            "language": getattr(info, 'language', ''),
            "path": info.path,
            "dataPath": getattr(info, 'data_path', ''),
            "commonDataPath": getattr(info, 'commondata_path', ''),
            "build": info.build,
            "maxBars": getattr(info, 'maxbars', 0),
            "codepage": getattr(info, 'codepage', 0),
            "mqid": bool(getattr(info, 'mqid', False)),
        }

        logger.info(f"[TERMINAL] {result['company']} build {result['build']}, "
                     f"ping={result['pingLast']}ms")
        return result

    def full_sync_v2(self, from_date: Optional[datetime] = None) -> Dict:
        """
        Enhanced full sync — includes EVERYTHING: account, trades, positions,
        orders, performance metrics, terminal info.

        Args:
            from_date: Start date for trade history

        Returns:
            Comprehensive sync dict with all available data
        """
        from performance_calculator import PerformanceCalculator

        logger.info("[FULL_SYNC_V2] Starting comprehensive synchronization")
        start_time = datetime.now()

        account = self.get_account_info_full()
        trades = self.get_trade_history(from_date, None)
        positions = self.get_open_positions()
        pending_orders = self.get_pending_orders()
        terminal = self.get_terminal_info()

        # Performance metrics
        performance = PerformanceCalculator.calculate_all(trades)

        sync_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)

        logger.info(f"[FULL_SYNC_V2] Complete: {len(trades)} trades, "
                     f"{len(positions)} positions, {len(pending_orders)} pending, "
                     f"sync_time={sync_time_ms}ms")

        return {
            "account": account,
            "trades": trades,
            "openPositions": positions,
            "pendingOrders": pending_orders,
            "performance": performance,
            "terminal": terminal,
            "syncTimeMs": sync_time_ms,
            "totalTradesFetched": len(trades),
        }

