"""
Test behavior_analyzer with Mongoose Trade model field names.
This validates that the Python engine correctly handles data from MongoDB.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from behavior_analyzer import (
    detect_revenge_trading, detect_early_exits, detect_overtrading,
    detect_impulsive_entries, calculate_mental_battery,
    _get_profit, _get_symbol, _get_open_time, _get_close_time, _get_ticket
)
from datetime import datetime, timedelta

base = datetime(2026, 4, 28, 10, 0, 0)

def make_mongo_trade(id_str, ticket, symbol, profit, volume, entry, exit_t, dur=None):
    """Create a trade dict matching Mongoose Trade model field names."""
    t = {
        '_id': id_str,
        'entryTime': entry.isoformat(),
        'exitTime': exit_t.isoformat(),
        'profitLoss': profit,
        'volume': volume,
        'mt5Symbol': symbol,
        'ticket': ticket,
    }
    if dur is not None:
        t['durationSeconds'] = dur
    return t


def test_mongoose_revenge():
    trades = [
        make_mongo_trade('a1', 1, 'EURUSD', -50.0, 0.1, base, base + timedelta(minutes=15)),
        make_mongo_trade('a2', 2, 'EURUSD', 30.0, 0.2, base + timedelta(minutes=16), base + timedelta(minutes=30)),
        make_mongo_trade('a3', 3, 'GBPUSD', 20.0, 0.1, base + timedelta(hours=2), base + timedelta(hours=3)),
    ]
    r = detect_revenge_trading(trades)
    assert r['detected'] is True, f"Expected detected=True, got {r}"
    assert r['count'] == 1
    print("  [PASS] Revenge detection with Mongoose fields")


def test_mongoose_early_exits():
    trades = []
    for i in range(8):
        t = base + timedelta(hours=i * 2)
        trades.append(make_mongo_trade(f'w{i}', 10+i, 'EURUSD', 100.0, 0.1, t, t + timedelta(minutes=60), 3600))
    for i in range(3):
        t = base + timedelta(hours=20 + i)
        trades.append(make_mongo_trade(f'e{i}', 100+i, 'EURUSD', 10.0, 0.1, t, t + timedelta(minutes=5), 300))

    e = detect_early_exits(trades)
    assert e['count'] == 3, f"Expected 3 early exits, got {e['count']}"
    assert e['potential_missed_profit'] > 0
    print("  [PASS] Early exit detection with Mongoose fields")


def test_mongoose_overtrading():
    trades = []
    for day in range(5):
        for i in range(3):
            t = base + timedelta(days=day, hours=i)
            trades.append(make_mongo_trade(f'd{day}t{i}', day*10+i, 'EURUSD', 10, 0.1, t, t + timedelta(minutes=30)))
    day_over = base + timedelta(days=6)
    for i in range(15):
        t = day_over + timedelta(minutes=i * 30)
        trades.append(make_mongo_trade(f'o{i}', 100+i, 'EURUSD', -5, 0.1, t, t + timedelta(minutes=15)))

    ot = detect_overtrading(trades)
    assert ot['detected'] is True
    print(f"  [PASS] Overtrading detection: {ot['overtrading_days']} flagged days")


def test_mongoose_impulsive():
    trades = [
        make_mongo_trade(f'imp{i}', i, 'EURUSD', 10, 0.1,
                         base + timedelta(minutes=i*2), base + timedelta(minutes=i*2+30))
        for i in range(5)
    ]
    trades.extend([
        make_mongo_trade(f'norm{i}', 10+i, 'GBPUSD', 20, 0.1,
                         base + timedelta(hours=2+i), base + timedelta(hours=3+i))
        for i in range(3)
    ])
    imp = detect_impulsive_entries(trades)
    assert imp['cluster_count'] >= 1
    print(f"  [PASS] Impulsive entries: {imp['cluster_count']} clusters")


def test_mongoose_mental_battery():
    trades = [
        make_mongo_trade(f'mb{i}', i, 'EURUSD', 50 if i % 3 != 0 else -20, 0.1,
                         base + timedelta(hours=i*2), base + timedelta(hours=i*2+1))
        for i in range(20)
    ]
    mb = calculate_mental_battery(trades)
    assert 0 <= mb['percentage'] <= 100
    assert mb['level'] in ('strong', 'stable', 'strained', 'low')
    print(f"  [PASS] Mental battery: {mb['percentage']}% ({mb['level']})")


def test_helper_fallbacks():
    # profitLoss (no 'profit' key)
    t1 = {'profitLoss': -100.0}
    assert _get_profit(t1) == -100.0, "profitLoss fallback failed"

    # mt5Symbol (no 'symbol' key)
    t2 = {'mt5Symbol': 'XAUUSD'}
    assert _get_symbol(t2) == 'XAUUSD', "mt5Symbol fallback failed"

    # entryTime / exitTime
    t3 = {'entryTime': base.isoformat(), 'exitTime': (base + timedelta(hours=1)).isoformat()}
    assert _get_open_time(t3) is not None, "entryTime fallback failed"
    assert _get_close_time(t3) is not None, "exitTime fallback failed"

    # ticket fallbacks
    t4 = {'mt5DealId': 12345}
    assert _get_ticket(t4) == 12345, "mt5DealId fallback failed"
    t5 = {'positionId': 67890}
    assert _get_ticket(t5) == 67890, "positionId fallback failed"

    print("  [PASS] All helper field fallbacks work")


if __name__ == '__main__':
    print("\n=== Mongoose Field Compatibility Tests ===\n")
    test_mongoose_revenge()
    test_mongoose_early_exits()
    test_mongoose_overtrading()
    test_mongoose_impulsive()
    test_mongoose_mental_battery()
    test_helper_fallbacks()
    print("\n[OK] All Mongoose compatibility tests passed!\n")
