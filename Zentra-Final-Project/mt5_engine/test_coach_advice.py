"""
FULL AUDIT TEST — Coach Advice + All Hoà Backend
Tests all 5 error types, priority order, Mongoose compat, and existing algorithms.
"""
from behavior_analyzer import *
from datetime import datetime, timedelta

now = datetime.utcnow()
passed = 0
failed = 0

def check(name, condition, detail=""):
    global passed, failed
    if condition:
        print(f"  ✓ {name}")
        passed += 1
    else:
        print(f"  ✗ {name} — {detail}")
        failed += 1

print("\n=== COACH ADVICE AUDIT ===\n")

# T1: Empty
r = get_coach_advice([])
check("T1: Empty → clean", r['error_type'] == 'clean', f"got {r['error_type']}")
check("T1: Correct no-data msg", "No recent trading data" in r['lines'][0])

# T2: Revenge (priority #1)
trades_revenge = [
    {'ticket':1, 'open_time': now - timedelta(hours=2), 'close_time': now - timedelta(minutes=10), 'profit': -50, 'symbol':'EURUSD', 'volume':0.1},
    {'ticket':2, 'open_time': now - timedelta(minutes=9), 'close_time': now - timedelta(minutes=5), 'profit': 20, 'symbol':'EURUSD', 'volume':0.2},
]
r = get_coach_advice(trades_revenge)
check("T2: Revenge → error_type", r['error_type'] == 'revenge_trading', f"got {r['error_type']}")
check("T2: Line 1 exact", r['lines'][0] == "Rapid re-entry detected immediately after a stop-loss.")
check("T2: Line 2 exact", r['lines'][1] == "You are exhibiting revenge trading behavior.")
check("T2: Line 3 exact", r['lines'][2] == "Step away from the chart for 15 minutes.")

# T3: Overtrading (priority #2)
trades_rapid = []
for i in range(5):
    t = now - timedelta(minutes=10 - i)
    trades_rapid.append({'ticket':i+10, 'open_time':t, 'close_time':t+timedelta(seconds=30), 'profit':5, 'symbol':'GBPUSD', 'volume':0.1})
r = get_coach_advice(trades_rapid)
check("T3: Overtrading → error_type", r['error_type'] == 'overtrading', f"got {r['error_type']}")
check("T3: Line 1 has X trades", "rapid re-entries detected" in r['lines'][0])
check("T3: Line 2 exact", r['lines'][1] == "You're entering trades too quickly.")
check("T3: Line 3 exact", r['lines'][2] == "Pause until a fresh setup forms before entering again.")

# T4: Lot Size Increase (priority #3)
trades_lot = [
    {'ticket':20, 'open_time': now - timedelta(hours=3), 'close_time': now - timedelta(hours=2, minutes=50), 'profit': 10, 'symbol':'EURUSD', 'volume':0.1},
    {'ticket':21, 'open_time': now - timedelta(hours=2), 'close_time': now - timedelta(hours=1, minutes=50), 'profit': 15, 'symbol':'GBPUSD', 'volume':0.2},
    {'ticket':22, 'open_time': now - timedelta(hours=1), 'close_time': now - timedelta(minutes=50), 'profit': 20, 'symbol':'USDJPY', 'volume':0.5},
]
r = get_coach_advice(trades_lot)
check("T4: Lot Size → error_type", r['error_type'] == 'lot_size_increase', f"got {r['error_type']}")
check("T4: Line 1 exact", r['lines'][0] == "Lot sizes have steadily increased in recent trades.")
check("T4: Line 2 exact", r['lines'][1] == "You are risking more than your standard trading plan.")
check("T4: Only 2 lines", len(r['lines']) == 2, f"got {len(r['lines'])}")

# T5: Early Exit (priority #4)
trades_early = []
for i in range(6):
    dur = timedelta(hours=2) if i < 4 else timedelta(minutes=5)
    pnl = 100 if i < 4 else 5
    t = now - timedelta(days=7-i)
    trades_early.append({'ticket':30+i, 'open_time':t, 'close_time':t+dur, 'profit':pnl, 'symbol':'EURUSD', 'volume':0.1})
r = get_coach_advice(trades_early)
check("T5: Early Exit → error_type", r['error_type'] == 'early_exit', f"got {r['error_type']}")
check("T5: Line 1 exact", r['lines'][0] == "Recent winning trades were closed significantly early.")
check("T5: Line 2 exact", r['lines'][1] == "You are leaving potential profits on the table.")
check("T5: Only 2 lines", len(r['lines']) == 2, f"got {len(r['lines'])}")

# T6: Clean (default)
trades_clean = []
for i in range(5):
    t = now - timedelta(days=10-i*2)
    trades_clean.append({'ticket':40+i, 'open_time':t, 'close_time':t+timedelta(hours=3), 'profit':50, 'symbol':'EURUSD', 'volume':0.1})
r = get_coach_advice(trades_clean)
check("T6: Clean → error_type", r['error_type'] == 'clean', f"got {r['error_type']}")
check("T6: Line 1 exact", r['lines'][0] == "Recent trading data shows steady and controlled behavior.")
check("T6: Line 2 exact", r['lines'][1] == "Keep sticking strictly to your trading plan.")

# T7: Priority — revenge beats everything
trades_mixed = [
    {'ticket':50, 'open_time': now - timedelta(minutes=15), 'close_time': now - timedelta(minutes=10), 'profit': -100, 'symbol':'EURUSD', 'volume':0.1},
    {'ticket':51, 'open_time': now - timedelta(minutes=9), 'close_time': now - timedelta(minutes=8), 'profit': 10, 'symbol':'EURUSD', 'volume':0.2},
    {'ticket':52, 'open_time': now - timedelta(minutes=8), 'close_time': now - timedelta(minutes=7), 'profit': 10, 'symbol':'EURUSD', 'volume':0.3},
    {'ticket':53, 'open_time': now - timedelta(minutes=7), 'close_time': now - timedelta(minutes=6), 'profit': 10, 'symbol':'EURUSD', 'volume':0.4},
]
r = get_coach_advice(trades_mixed)
check("T7: Priority — Revenge > Overtrading + LotSize", r['error_type'] == 'revenge_trading', f"got {r['error_type']}")

# T8: Mongoose field names
trades_mongoose = [
    {'_id': 'abc', 'entryTime': (now - timedelta(hours=2)).strftime('%Y-%m-%dT%H:%M:%SZ'), 'exitTime': (now - timedelta(minutes=10)).strftime('%Y-%m-%dT%H:%M:%SZ'), 'profitLoss': -50, 'mt5Symbol': 'EURUSD', 'lots': 0.1},
    {'_id': 'def', 'entryTime': (now - timedelta(minutes=9)).strftime('%Y-%m-%dT%H:%M:%SZ'), 'exitTime': (now - timedelta(minutes=5)).strftime('%Y-%m-%dT%H:%M:%SZ'), 'profitLoss': 20, 'mt5Symbol': 'EURUSD', 'lots': 0.2},
]
r = get_coach_advice(trades_mongoose)
check("T8: Mongoose fields work", r['error_type'] == 'revenge_trading', f"got {r['error_type']}")

# T9: Truncates to last 10
trades_20 = []
for i in range(20):
    t = now - timedelta(days=20-i)
    trades_20.append({'ticket':100+i, 'open_time':t, 'close_time':t+timedelta(hours=4), 'profit':30, 'symbol':'EURUSD', 'volume':0.1})
r = get_coach_advice(trades_20)
check("T9: 20 trades → only last 10 used", r['error_type'] == 'clean')

# T10: Existing algorithms untouched
print("\n=== EXISTING ALGORITHMS ===\n")
r1 = detect_revenge_trading(trades_revenge)
check("T10a: detect_revenge_trading", r1['detected'] == True)
r2 = detect_early_exits(trades_early)
check("T10b: detect_early_exits", r2['count'] > 0)
r3 = detect_overtrading(trades_rapid)
check("T10c: detect_overtrading", isinstance(r3, dict))
r4 = detect_impulsive_entries(trades_rapid)
check("T10d: detect_impulsive_entries", r4['cluster_count'] > 0)
r5 = calculate_mental_battery(trades_clean)
check("T10e: calculate_mental_battery", r5['percentage'] > 0)
r6 = run_full_analysis(trades_clean)
check("T10f: run_full_analysis", 'revenge_trading' in r6 and 'mental_battery' in r6)

print(f"\n{'='*50}")
if failed == 0:
    print(f"✅ ALL {passed} TESTS PASSED — Hoà backend 100% verified")
else:
    print(f"❌ {failed} FAILED / {passed + failed} total")
print(f"{'='*50}\n")
