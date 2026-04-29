"""
Unit tests for behavior_analyzer.py
"""
import sys
import os
import json
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from behavior_analyzer import (
    detect_revenge_trading,
    detect_early_exits,
    detect_overtrading,
    detect_impulsive_entries,
    calculate_mental_battery,
    run_full_analysis,
)


def make_trade(ticket, symbol, profit, volume, open_time, close_time):
    return {
        'ticket': ticket,
        'symbol': symbol,
        'profit': profit,
        'volume': volume,
        'open_time': open_time.isoformat(),
        'close_time': close_time.isoformat(),
    }


def test_revenge_trading():
    """Test revenge trading detection."""
    base = datetime(2026, 4, 28, 10, 0, 0)

    # Trade 1: Loss at 10:00, close at 10:15
    # Trade 2: Revenge at 10:16 (1 min after loss), same symbol, bigger volume
    trades = [
        make_trade(1, 'EURUSD', -50.0, 0.1, base, base + timedelta(minutes=15)),
        make_trade(2, 'EURUSD', 30.0, 0.2, base + timedelta(minutes=16), base + timedelta(minutes=30)),
        make_trade(3, 'GBPUSD', 20.0, 0.1, base + timedelta(hours=2), base + timedelta(hours=3)),
    ]

    result = detect_revenge_trading(trades)
    assert result['detected'] is True, f"Expected detected=True, got {result['detected']}"
    assert result['count'] == 1, f"Expected count=1, got {result['count']}"
    assert result['severity'] == 'low'
    print("  ✓ Revenge trading detection works")


def test_no_revenge():
    """Test no revenge when trades are far apart."""
    base = datetime(2026, 4, 28, 10, 0, 0)
    trades = [
        make_trade(1, 'EURUSD', -50.0, 0.1, base, base + timedelta(minutes=15)),
        make_trade(2, 'GBPUSD', 30.0, 0.1, base + timedelta(hours=2), base + timedelta(hours=3)),
    ]

    result = detect_revenge_trading(trades)
    assert result['detected'] is False
    assert result['count'] == 0
    print("  ✓ No false revenge detection")


def test_early_exits():
    """Test early exit detection."""
    base = datetime(2026, 4, 28, 10, 0, 0)

    # Normal winners: ~60 min duration, ~$100 profit
    trades = [
        make_trade(i, 'EURUSD', 100.0, 0.1,
                   base + timedelta(hours=i), base + timedelta(hours=i, minutes=60))
        for i in range(8)
    ]
    # Early exits: 5 min duration, $10 profit
    trades.extend([
        make_trade(100 + i, 'EURUSD', 10.0, 0.1,
                   base + timedelta(hours=10 + i), base + timedelta(hours=10 + i, minutes=5))
        for i in range(3)
    ])

    result = detect_early_exits(trades)
    assert result['count'] == 3, f"Expected 3 early exits, got {result['count']}"
    assert result['rate'] > 0
    assert result['potential_missed_profit'] > 0
    print("  ✓ Early exit detection works")


def test_overtrading():
    """Test overtrading detection."""
    base = datetime(2026, 4, 28, 10, 0, 0)

    trades = []
    # Normal days: 3 trades each
    for day in range(5):
        for i in range(3):
            t = base + timedelta(days=day, hours=i)
            trades.append(make_trade(day * 10 + i, 'EURUSD', 10, 0.1, t, t + timedelta(minutes=30)))

    # Overtrading day: 15 trades
    day_over = base + timedelta(days=6)
    for i in range(15):
        t = day_over + timedelta(hours=0, minutes=i * 30)
        trades.append(make_trade(100 + i, 'EURUSD', -5, 0.1, t, t + timedelta(minutes=15)))

    result = detect_overtrading(trades)
    assert result['detected'] is True
    assert result['overtrading_days'] >= 1
    print("  ✓ Overtrading detection works")


def test_impulsive_entries():
    """Test impulsive entry detection."""
    base = datetime(2026, 4, 28, 10, 0, 0)

    # Rapid cluster: 5 trades in 10 minutes
    trades = [
        make_trade(i, 'EURUSD', 10, 0.1,
                   base + timedelta(minutes=i * 2), base + timedelta(minutes=i * 2 + 30))
        for i in range(5)
    ]
    # Spread out trades
    trades.extend([
        make_trade(10 + i, 'GBPUSD', 20, 0.1,
                   base + timedelta(hours=2 + i), base + timedelta(hours=3 + i))
        for i in range(3)
    ])

    result = detect_impulsive_entries(trades)
    assert result['cluster_count'] >= 1
    assert result['total_impulsive_trades'] >= 3
    print("  ✓ Impulsive entry detection works")


def test_mental_battery():
    """Test mental battery composite score."""
    base = datetime(2026, 4, 28, 10, 0, 0)

    # Healthy trader: consistent wins, no revenge
    trades = [
        make_trade(i, 'EURUSD', 50 if i % 3 != 0 else -20, 0.1,
                   base + timedelta(hours=i * 2), base + timedelta(hours=i * 2 + 1))
        for i in range(20)
    ]

    result = calculate_mental_battery(trades)
    assert 0 <= result['percentage'] <= 100
    assert result['level'] in ('strong', 'stable', 'strained', 'low')
    assert result['message']
    assert isinstance(result['factors'], list)
    print(f"  ✓ Mental battery: {result['percentage']}% ({result['level']})")


def test_full_analysis():
    """Test full analysis wrapper."""
    base = datetime(2026, 4, 28, 10, 0, 0)
    trades = [
        make_trade(i, 'EURUSD', 30 if i % 2 == 0 else -10, 0.1,
                   base + timedelta(hours=i), base + timedelta(hours=i, minutes=45))
        for i in range(10)
    ]

    result = run_full_analysis(trades)
    assert 'revenge_trading' in result
    assert 'early_exits' in result
    assert 'overtrading' in result
    assert 'impulsive_entries' in result
    assert 'mental_battery' in result
    assert result['trade_count'] == 10
    print("  ✓ Full analysis works")


def test_empty_trades():
    """Test all functions with empty input."""
    result = detect_revenge_trading([])
    assert result['detected'] is False

    result = detect_early_exits([])
    assert result['insufficient_data'] is True

    result = detect_overtrading([])
    assert result['detected'] is False

    result = calculate_mental_battery([])
    assert result['insufficient_data'] is True
    print("  ✓ Empty input handling works")


if __name__ == '__main__':
    print("\n=== Behavior Analyzer Tests ===\n")
    test_revenge_trading()
    test_no_revenge()
    test_early_exits()
    test_overtrading()
    test_impulsive_entries()
    test_mental_battery()
    test_full_analysis()
    test_empty_trades()
    print("\n✅ All tests passed!\n")
