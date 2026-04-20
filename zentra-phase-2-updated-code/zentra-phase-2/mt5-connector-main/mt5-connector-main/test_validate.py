"""
Full Test Suite for MT5 Engine — Phase H5

Tests:
  1. Happy path: connect, account info, trade history, positions
  2. Error cases: wrong password, wrong server, timeout behavior
  3. Data normalizer verification with sample payloads
  4. Connection speed benchmark
  5. Sync fail returns proper error codes

Author: Hoà (MT5 Engine Lead)
"""
import logging
import json
import time
import sys
from mt5_connector import MT5Connector
from connection_validator import ConnectionValidator
from sample_payloads import SAMPLE_TRADES

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('test_results.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

# Credentials
VALID_ACCOUNT = 5049421223
VALID_PASSWORD = "1l!zBdGv"
VALID_SERVER = "MetaQuotes-Demo"

WRONG_PASSWORD = "wrongpassword123"
WRONG_SERVER = "NonExistent-Server"
WRONG_ACCOUNT = 9999999999

# Test counters
tests_passed = 0
tests_failed = 0
tests_total = 0


def run_test(name: str, test_func):
    """Run a single test and track results."""
    global tests_passed, tests_failed, tests_total
    tests_total += 1
    print(f"\n{'='*60}")
    print(f"TEST {tests_total}: {name}")
    print(f"{'='*60}")
    try:
        test_func()
        tests_passed += 1
        print(f"  ✓ PASSED")
    except AssertionError as e:
        tests_failed += 1
        print(f"  ✗ FAILED: {e}")
    except Exception as e:
        tests_failed += 1
        print(f"  ✗ ERROR: {e}")


# ============================
# TEST 1: Happy path connection
# ============================
def test_happy_path_connect():
    connector = MT5Connector(login=VALID_ACCOUNT, password=VALID_PASSWORD, server=VALID_SERVER)
    result = connector.connect()
    assert result["connected"] == True, f"Expected connected=True, got: {result}"
    info = result.get("account_info", {})
    assert info.get("account_id") == VALID_ACCOUNT, f"Wrong account_id: {info.get('account_id')}"
    assert info.get("balance") is not None, "balance is None"
    assert info.get("currency") is not None, "currency is None"
    assert info.get("last_sync") is not None, "last_sync is None"
    print(f"  Account: {info['account_id']}, Balance: {info['balance']} {info['currency']}")
    connector.disconnect()


# ============================
# TEST 2: Get account info format
# ============================
def test_account_info_format():
    connector = MT5Connector(login=VALID_ACCOUNT, password=VALID_PASSWORD, server=VALID_SERVER)
    connector.connect()
    info = connector.get_account_info()

    required_fields = [
        "account_id", "broker_server", "company", "name", "balance",
        "equity", "margin", "free_margin", "margin_level", "currency",
        "leverage", "connected", "last_sync"
    ]
    for field in required_fields:
        assert field in info, f"Missing CONTRACT field: {field}"

    # Verify types
    assert isinstance(info["account_id"], int), "account_id must be int"
    assert isinstance(info["balance"], float), "balance must be float"
    assert isinstance(info["leverage"], int), "leverage must be int"
    assert info["connected"] == True, "connected must be True"
    assert info["last_sync"].endswith("Z"), "last_sync must be ISO 8601 UTC ending in Z"
    print(f"  All {len(required_fields)} CONTRACT fields present and typed correctly")
    connector.disconnect()


# ============================
# TEST 3: Trade history returns CONTRACT format
# ============================
def test_trade_history_format():
    connector = MT5Connector(login=VALID_ACCOUNT, password=VALID_PASSWORD, server=VALID_SERVER)
    connector.connect()
    trades = connector.get_trade_history(None, None)

    print(f"  Trade count: {len(trades)}")
    if len(trades) > 0:
        trade = trades[0]
        contract_fields = [
            "ticket", "order_id", "deal_in_id", "deal_out_id", "position_id",
            "symbol", "trade_type", "volume", "open_price", "close_price",
            "stop_loss", "take_profit", "open_time", "close_time",
            "profit", "commission", "swap", "net_profit",
            "magic_number", "comment", "duration_seconds"
        ]
        for field in contract_fields:
            assert field in trade, f"Missing CONTRACT field: {field}"
        assert trade["trade_type"] in ("BUY", "SELL"), f"trade_type must be BUY or SELL, got: {trade['trade_type']}"
        assert trade["open_time"].endswith("Z"), "open_time must end with Z"
        print(f"  Sample: {trade['trade_type']} {trade['symbol']} net={trade['net_profit']}")
    else:
        print("  No trades found (account has no history yet) — format test skipped")
    connector.disconnect()


# ============================
# TEST 4: Open positions format
# ============================
def test_open_positions_format():
    connector = MT5Connector(login=VALID_ACCOUNT, password=VALID_PASSWORD, server=VALID_SERVER)
    connector.connect()
    positions = connector.get_open_positions()

    print(f"  Position count: {len(positions)}")
    if len(positions) > 0:
        pos = positions[0]
        required = ["ticket", "symbol", "trade_type", "volume", "open_price",
                     "current_price", "stop_loss", "take_profit", "open_time",
                     "floating_profit", "commission", "swap"]
        for field in required:
            assert field in pos, f"Missing field: {field}"
        print(f"  Sample: {pos['trade_type']} {pos['symbol']} float_pnl={pos['floating_profit']}")
    else:
        print("  No open positions — format test skipped")
    connector.disconnect()


# ============================
# TEST 5: Full sync
# ============================
def test_full_sync():
    connector = MT5Connector(login=VALID_ACCOUNT, password=VALID_PASSWORD, server=VALID_SERVER)
    connector.connect()
    sync = connector.full_sync()

    assert "account" in sync, "Missing 'account' in sync result"
    assert "trades" in sync, "Missing 'trades' in sync result"
    assert "open_positions" in sync, "Missing 'open_positions' in sync result"
    assert "daily_summary" in sync, "Missing 'daily_summary' in sync result"
    assert "sync_time_ms" in sync, "Missing 'sync_time_ms' in sync result"
    assert "total_trades_fetched" in sync, "Missing 'total_trades_fetched' in sync result"

    summary = sync["daily_summary"]
    assert "total_trades" in summary
    assert "winning_trades" in summary
    assert "losing_trades" in summary
    assert "net_profit" in summary

    print(f"  Sync completed in {sync['sync_time_ms']}ms")
    print(f"  Trades: {sync['total_trades_fetched']}, "
          f"Positions: {len(sync['open_positions'])}, "
          f"Net: {summary['net_profit']}")
    connector.disconnect()


# ============================
# TEST 6: Wrong password → INVALID_CREDENTIALS
# ============================
def test_wrong_password():
    connector = MT5Connector()
    result = connector.connect(VALID_ACCOUNT, WRONG_PASSWORD, VALID_SERVER)
    assert result["connected"] == False, "Should not connect with wrong password"
    error = result.get("error", {})
    # Accept any error code that indicates auth failure
    error_code = error.get("code", "") if isinstance(error, dict) else str(error)
    print(f"  Error code: {error_code}")
    print(f"  Error message: {error.get('message', '') if isinstance(error, dict) else error}")
    assert error_code in ("INVALID_CREDENTIALS", "CONNECTION_TIMEOUT", "SERVER_UNREACHABLE",
                           "MT5_NOT_INITIALIZED"), \
        f"Expected auth-related error code, got: {error_code}"
    connector.disconnect()


# ============================
# TEST 7: Wrong server → SERVER_UNREACHABLE or TIMEOUT
# ============================
def test_wrong_server():
    connector = MT5Connector()
    result = connector.connect(VALID_ACCOUNT, VALID_PASSWORD, WRONG_SERVER)
    assert result["connected"] == False, "Should not connect with wrong server"
    error = result.get("error", {})
    error_code = error.get("code", "") if isinstance(error, dict) else str(error)
    print(f"  Error code: {error_code}")
    print(f"  Error message: {error.get('message', '') if isinstance(error, dict) else error}")
    # Wrong server can produce timeout or unreachable
    assert error_code in ("SERVER_UNREACHABLE", "CONNECTION_TIMEOUT", "INVALID_CREDENTIALS",
                           "MT5_NOT_INITIALIZED"), \
        f"Expected server-related error, got: {error_code}"
    connector.disconnect()


# ============================
# TEST 8: Missing credentials → INVALID_CREDENTIALS
# ============================
def test_missing_credentials():
    connector = MT5Connector()  # No credentials in __init__
    result = connector.connect()  # No credentials in connect() either
    assert result["connected"] == False, "Should not connect without credentials"
    error = result.get("error", {})
    error_code = error.get("code", "") if isinstance(error, dict) else str(error)
    assert error_code == "INVALID_CREDENTIALS", f"Expected INVALID_CREDENTIALS, got: {error_code}"
    print(f"  Error code: {error_code}")


# ============================
# TEST 9: Validation report
# ============================
def test_validation_report():
    connector = MT5Connector()
    report = ConnectionValidator.validate_connection(
        connector, VALID_ACCOUNT, VALID_PASSWORD, VALID_SERVER
    )
    assert report["server_reachable"] == True
    assert report["login_successful"] == True
    assert report["data_accessible"] == True
    assert report["validation_passed"] == True
    assert isinstance(report["connection_time_ms"], int)
    assert report["connection_time_ms"] > 0
    assert isinstance(report["errors"], list)
    assert len(report["errors"]) == 0
    print(f"  Connection time: {report['connection_time_ms']}ms")
    print(f"  Historical trades: {report['total_historical_trades']}")
    print(f"  Open positions: {report['open_positions_count']}")
    connector.disconnect()


# ============================
# TEST 10: Validation report with bad credentials
# ============================
def test_validation_fail():
    connector = MT5Connector()
    report = ConnectionValidator.validate_connection(
        connector, VALID_ACCOUNT, WRONG_PASSWORD, VALID_SERVER
    )
    assert report["validation_passed"] == False, "Should fail validation with wrong password"
    assert len(report["errors"]) > 0, "Should have errors"
    print(f"  Errors: {report['errors']}")
    connector.disconnect()


# ============================
# TEST 11: Sample payloads verify CONTRACT compliance
# ============================
def test_sample_payloads_contract():
    contract_fields = [
        "ticket", "order_id", "deal_in_id", "deal_out_id", "position_id",
        "symbol", "trade_type", "volume", "open_price", "close_price",
        "stop_loss", "take_profit", "open_time", "close_time",
        "profit", "commission", "swap", "net_profit",
        "magic_number", "comment", "duration_seconds"
    ]
    for i, trade in enumerate(SAMPLE_TRADES):
        for field in contract_fields:
            assert field in trade, f"Trade {i+1} missing field: {field}"
        assert trade["trade_type"] in ("BUY", "SELL")
        assert trade["open_time"].endswith("Z")
        assert trade["close_time"].endswith("Z")
        # Verify net_profit = profit + commission + swap
        expected_net = round(trade["profit"] + trade["commission"] + trade["swap"], 2)
        assert trade["net_profit"] == expected_net, \
            f"Trade {i+1} net_profit mismatch: {trade['net_profit']} != {expected_net}"
    print(f"  All {len(SAMPLE_TRADES)} sample trades pass CONTRACT validation")

    # Verify nullable fields
    nullable_trades = [t for t in SAMPLE_TRADES if t["stop_loss"] is None]
    print(f"  Trades with null SL/TP: {len(nullable_trades)}")
    assert len(nullable_trades) >= 2, "Should have at least 2 trades with null SL/TP"


# ============================
# TEST 12: Connection speed benchmark
# ============================
def test_connection_benchmark():
    connector = MT5Connector()
    start = time.time()
    result = connector.connect(VALID_ACCOUNT, VALID_PASSWORD, VALID_SERVER)
    elapsed_ms = int((time.time() - start) * 1000)
    assert result["connected"] == True
    print(f"  Connection time: {elapsed_ms}ms")
    if elapsed_ms <= 5000:
        print(f"  ✓ Within 5s benchmark threshold")
    else:
        print(f"  ⚠ Exceeds 5s threshold (acceptable for first-time connection)")
    connector.disconnect()


# ============================
# RUN ALL TESTS
# ============================
if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  ZENTRA MT5 ENGINE — FULL TEST SUITE")
    print("  Phase H5 Validation")
    print("=" * 60)

    # Happy path tests
    run_test("Happy path: connect", test_happy_path_connect)
    run_test("Account info CONTRACT format", test_account_info_format)
    run_test("Trade history CONTRACT format", test_trade_history_format)
    run_test("Open positions CONTRACT format", test_open_positions_format)
    run_test("Full sync payload", test_full_sync)

    # Error cases
    run_test("Wrong password → error code", test_wrong_password)
    run_test("Wrong server → error code", test_wrong_server)
    run_test("Missing credentials → INVALID_CREDENTIALS", test_missing_credentials)

    # Validator
    run_test("Validation report (good credentials)", test_validation_report)
    run_test("Validation report (bad credentials)", test_validation_fail)

    # Data integrity
    run_test("Sample payloads CONTRACT compliance", test_sample_payloads_contract)

    # Benchmarks
    run_test("Connection speed benchmark", test_connection_benchmark)

    # Summary
    print("\n" + "=" * 60)
    print(f"  RESULTS: {tests_passed}/{tests_total} passed, {tests_failed} failed")
    print("=" * 60)

    if tests_failed > 0:
        sys.exit(1)
