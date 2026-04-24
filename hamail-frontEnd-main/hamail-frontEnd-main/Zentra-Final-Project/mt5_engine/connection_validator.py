"""
Connection Validator Module — Phase H4

Validates MT5 connection quality and generates a diagnostic report.
Checks: server reachability, login success, data accessibility,
trade history availability, latency benchmarks.

Author: Hoà (MT5 Engine Lead)
"""
import time
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Benchmark thresholds
MAX_ACCEPTABLE_LATENCY_MS = 5000  # 5 seconds as per spec


class ConnectionValidator:
    """
    Validates end-to-end MT5 connectivity and data access.

    Produces a validation report with all fields required by spec:
    - server_reachable
    - login_successful
    - connection_time_ms
    - data_accessible
    - total_historical_trades
    - oldest_trade_date / newest_trade_date
    - open_positions_count
    - validation_passed
    - errors[]
    """

    @staticmethod
    def validate_connection(connector, account_id: int, password: str,
                            server: str, manual_login: bool = False) -> Dict[str, Any]:
        """
        Run full connection validation and return diagnostic report.

        Args:
            connector: MT5Connector instance
            account_id: MT5 account ID
            password: MT5 password
            server: MT5 server name
            manual_login: Whether to use UI automation

        Returns:
            Validation report dict
        """
        report = {
            "server_reachable": False,
            "login_successful": False,
            "connection_time_ms": 0,
            "latency_acceptable": False,
            "data_accessible": False,
            "total_historical_trades": 0,
            "oldest_trade_date": None,
            "newest_trade_date": None,
            "open_positions_count": 0,
            "validation_passed": False,
            "errors": []
        }

        logger.info(f"[VALIDATOR] Starting validation for account {account_id} @ {server}")

        # Step 1: Test connection
        start_time = time.time()
        try:
            result = connector.connect(account_id, password, server, manual_login)
            elapsed_ms = int((time.time() - start_time) * 1000)
            report["connection_time_ms"] = elapsed_ms
            report["latency_acceptable"] = elapsed_ms <= MAX_ACCEPTABLE_LATENCY_MS

            logger.info(f"[VALIDATOR] Connection attempt completed in {elapsed_ms}ms")
        except Exception as e:
            report["errors"].append(f"Connection exception: {str(e)}")
            logger.error(f"[VALIDATOR] Connection exception: {e}", exc_info=True)
            return report

        # Step 2: Check connection result
        if result.get("connected"):
            report["server_reachable"] = True
            report["login_successful"] = True
            logger.info("[VALIDATOR] ✓ Server reachable, login successful")
        else:
            error = result.get("error", {})
            error_msg = error.get("message", str(error)) if isinstance(error, dict) else str(error)
            error_code = error.get("code", "UNKNOWN") if isinstance(error, dict) else "UNKNOWN"
            report["errors"].append(f"{error_code}: {error_msg}")
            logger.error(f"[VALIDATOR] ✗ Connection failed: {error_code} — {error_msg}")
            return report

        # Step 3: Test data access — trade history
        try:
            logger.info("[VALIDATOR] Fetching trade history...")
            trades = connector.get_trade_history(None, None)
            report["data_accessible"] = True
            report["total_historical_trades"] = len(trades)

            if len(trades) > 0:
                # Sort by open_time to get oldest/newest
                sorted_trades = sorted(trades, key=lambda t: t["open_time"])
                report["oldest_trade_date"] = sorted_trades[0]["open_time"]
                report["newest_trade_date"] = sorted_trades[-1]["close_time"]
                logger.info(f"[VALIDATOR] ✓ Trade history: {len(trades)} trades, "
                             f"oldest={report['oldest_trade_date']}, "
                             f"newest={report['newest_trade_date']}")
            else:
                logger.info("[VALIDATOR] ✓ Trade history accessible but empty (0 trades)")

        except Exception as e:
            report["errors"].append(f"Trade history error: {str(e)}")
            logger.error(f"[VALIDATOR] ✗ Trade history failed: {e}", exc_info=True)

        # Step 4: Test data access — open positions
        try:
            logger.info("[VALIDATOR] Fetching open positions...")
            positions = connector.get_open_positions()
            report["open_positions_count"] = len(positions)
            logger.info(f"[VALIDATOR] ✓ Open positions: {len(positions)}")
        except Exception as e:
            report["errors"].append(f"Positions error: {str(e)}")
            logger.error(f"[VALIDATOR] ✗ Positions failed: {e}", exc_info=True)

        # Step 5: Final verdict
        if (report["server_reachable"] and
                report["login_successful"] and
                report["data_accessible"] and
                len(report["errors"]) == 0):
            report["validation_passed"] = True
            logger.info("[VALIDATOR] ✓✓✓ VALIDATION PASSED ✓✓✓")
        else:
            logger.warning(f"[VALIDATOR] ✗ VALIDATION FAILED — errors: {report['errors']}")

        return report
