"""
ZENTRA Phase 2 — Core Behavioral Analysis Algorithms
=====================================================
Detects psychological trading patterns from MT5 trade data:
- Revenge Trading
- Early Exits
- Overtrading
- Impulsive Entries
- Mental Battery (composite score)

Author: Đàm Văn Hoà
Date: April 2026
"""

from datetime import datetime, timedelta
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


# ─── REVENGE TRADING DETECTION ────────────────────────────────────────────────

def detect_revenge_trading(trades, time_threshold_sec=300, volume_multiplier=1.5):
    """
    Detect revenge trading patterns.

    Conditions:
    1. Previous trade was a LOSS
    2. New trade opened within `time_threshold_sec` after closing the losing trade
    3. Same symbol OR volume >= volume_multiplier * previous volume

    Args:
        trades: list of trade dicts with keys: ticket, open_time, close_time,
                profit, symbol, volume, type
        time_threshold_sec: max seconds between loss close and revenge open (default 300 = 5min)
        volume_multiplier: volume ratio threshold (default 1.5x)

    Returns:
        dict with detected, count, severity, revenge_rate, trades
    """
    if not trades or len(trades) < 2:
        return {
            'detected': False,
            'count': 0,
            'severity': 'none',
            'revenge_rate': 0,
            'trades': []
        }

    sorted_trades = sorted(trades, key=lambda t: _get_close_time(t) or datetime.min)
    revenge_trades = []

    for i in range(1, len(sorted_trades)):
        prev = sorted_trades[i - 1]
        curr = sorted_trades[i]

        prev_profit = _get_profit(prev)
        if prev_profit >= 0:
            continue  # Previous was not a loss

        prev_close = _get_close_time(prev)
        curr_open = _get_open_time(curr)

        if prev_close is None or curr_open is None:
            continue

        time_gap = (curr_open - prev_close).total_seconds()

        if time_gap < 0 or time_gap > time_threshold_sec:
            continue

        same_symbol = _get_symbol(curr) == _get_symbol(prev)
        bigger_size = _get_volume(curr) >= _get_volume(prev) * volume_multiplier

        if same_symbol or bigger_size:
            revenge_trades.append({
                'trigger_trade': _get_ticket(prev),
                'trigger_profit': round(prev_profit, 2),
                'revenge_trade': _get_ticket(curr),
                'revenge_profit': round(_get_profit(curr), 2),
                'time_gap_seconds': round(time_gap),
                'same_symbol': same_symbol,
                'volume_increase': bigger_size,
                'symbol': _get_symbol(curr)
            })

    total_losses = sum(1 for t in sorted_trades if _get_profit(t) < 0)
    count = len(revenge_trades)

    if count > 5:
        severity = 'high'
    elif count > 2:
        severity = 'medium'
    elif count > 0:
        severity = 'low'
    else:
        severity = 'none'

    return {
        'detected': count > 0,
        'count': count,
        'severity': severity,
        'revenge_rate': round(count / max(1, total_losses), 4),
        'total_losses': total_losses,
        'trades': revenge_trades
    }


# ─── EARLY EXIT DETECTION ─────────────────────────────────────────────────────

def detect_early_exits(trades, duration_ratio=0.3, profit_ratio=0.5, min_trades=5):
    """
    Detect early exit patterns — closing winning trades too early.

    Conditions:
    1. Trade is a winner (profit > 0)
    2. Duration < duration_ratio * average winning duration
    3. Profit < profit_ratio * average winning profit

    Args:
        trades: list of trade dicts
        duration_ratio: threshold ratio vs average duration (default 0.3 = 30%)
        profit_ratio: threshold ratio vs average profit (default 0.5 = 50%)
        min_trades: minimum winning trades needed for analysis

    Returns:
        dict with rate, count, avg_exit_time, potential_missed_profit, trades
    """
    winning_trades = [t for t in trades if _get_profit(t) > 0]

    if len(winning_trades) < min_trades:
        return {
            'rate': 0,
            'count': 0,
            'total_winners': len(winning_trades),
            'avg_winner_duration_sec': 0,
            'avg_winner_profit': 0,
            'potential_missed_profit': 0,
            'trades': [],
            'insufficient_data': True
        }

    avg_duration = sum(_get_duration(t) for t in winning_trades) / len(winning_trades)
    avg_profit = sum(_get_profit(t) for t in winning_trades) / len(winning_trades)

    early_exits = []
    for t in winning_trades:
        dur = _get_duration(t)
        pnl = _get_profit(t)
        if dur < avg_duration * duration_ratio and pnl < avg_profit * profit_ratio:
            early_exits.append({
                'ticket': _get_ticket(t),
                'symbol': _get_symbol(t),
                'duration_seconds': round(dur),
                'profit': round(pnl, 2),
                'avg_duration_pct': round((dur / max(1, avg_duration)) * 100, 1),
                'avg_profit_pct': round((pnl / max(0.01, avg_profit)) * 100, 1),
                'missed_profit': round(avg_profit - pnl, 2)
            })

    count = len(early_exits)
    potential_missed = sum(e['missed_profit'] for e in early_exits)

    return {
        'rate': round(count / len(winning_trades), 4),
        'count': count,
        'total_winners': len(winning_trades),
        'avg_winner_duration_sec': round(avg_duration),
        'avg_winner_profit': round(avg_profit, 2),
        'avg_early_exit_duration_sec': round(
            sum(e['duration_seconds'] for e in early_exits) / max(1, count)
        ),
        'potential_missed_profit': round(potential_missed, 2),
        'trades': early_exits,
        'insufficient_data': False
    }


# ─── OVERTRADING DETECTION ────────────────────────────────────────────────────

def detect_overtrading(trades, multiplier=2.0):
    """
    Detect overtrading — abnormally high trade count on certain days.

    Conditions:
    1. Group trades by day
    2. Calculate daily average
    3. Days with count > multiplier * average = overtrading

    Args:
        trades: list of trade dicts
        multiplier: how many times above average to flag (default 2.0)

    Returns:
        dict with detected, daily_avg, peak_day, overtrading_days, details
    """
    if not trades:
        return {
            'detected': False,
            'daily_avg': 0,
            'peak_day': None,
            'peak_count': 0,
            'overtrading_days': 0,
            'total_days': 0,
            'excess_trades': 0,
            'daily_breakdown': []
        }

    daily = defaultdict(list)
    for t in trades:
        open_time = _get_open_time(t)
        if open_time:
            day = open_time.strftime('%Y-%m-%d')
            daily[day].append(t)

    if not daily:
        return {
            'detected': False, 'daily_avg': 0, 'peak_day': None,
            'peak_count': 0, 'overtrading_days': 0, 'total_days': 0,
            'excess_trades': 0, 'daily_breakdown': []
        }

    counts = {day: len(ts) for day, ts in daily.items()}
    avg = sum(counts.values()) / len(counts)
    threshold = avg * multiplier

    peak_day = max(counts, key=counts.get)
    overtrading_days = []

    for day, count in sorted(counts.items()):
        day_pnl = sum(_get_profit(t) for t in daily[day])
        is_over = count > threshold
        overtrading_days.append({
            'date': day,
            'trade_count': count,
            'pnl': round(day_pnl, 2),
            'is_overtrading': is_over,
            'excess': max(0, count - round(avg)) if is_over else 0
        })

    flagged = [d for d in overtrading_days if d['is_overtrading']]
    excess_total = sum(d['excess'] for d in flagged)

    return {
        'detected': len(flagged) > 0,
        'daily_avg': round(avg, 1),
        'threshold': round(threshold, 1),
        'peak_day': peak_day,
        'peak_count': counts[peak_day],
        'overtrading_days': len(flagged),
        'total_days': len(counts),
        'excess_trades': excess_total,
        'daily_breakdown': overtrading_days
    }


# ─── IMPULSIVE ENTRY DETECTION ────────────────────────────────────────────────

def detect_impulsive_entries(trades, gap_threshold_sec=300, cluster_min=3):
    """
    Detect impulsive entry patterns — rapid consecutive trade openings.

    Conditions:
    1. Multiple trades opened within gap_threshold_sec of each other
    2. A cluster = cluster_min or more trades in rapid succession

    Args:
        trades: list of trade dicts
        gap_threshold_sec: max seconds between opens to be "rapid" (default 300 = 5min)
        cluster_min: minimum trades in a cluster (default 3)

    Returns:
        dict with rate, clusters, avg_gap_seconds, total_impulsive_trades
    """
    if len(trades) < cluster_min:
        return {
            'rate': 0,
            'cluster_count': 0,
            'total_impulsive_trades': 0,
            'avg_gap_seconds': 0,
            'clusters': [],
            'insufficient_data': True
        }

    sorted_trades = sorted(trades, key=lambda t: _get_open_time(t) or datetime.min)
    clusters = []
    current_cluster = [sorted_trades[0]]
    all_gaps = []

    for i in range(1, len(sorted_trades)):
        prev_open = _get_open_time(sorted_trades[i - 1])
        curr_open = _get_open_time(sorted_trades[i])

        if prev_open is None or curr_open is None:
            if len(current_cluster) >= cluster_min:
                clusters.append(current_cluster)
            current_cluster = [sorted_trades[i]]
            continue

        gap = (curr_open - prev_open).total_seconds()

        if 0 <= gap <= gap_threshold_sec:
            current_cluster.append(sorted_trades[i])
            all_gaps.append(gap)
        else:
            if len(current_cluster) >= cluster_min:
                clusters.append(current_cluster)
            current_cluster = [sorted_trades[i]]

    if len(current_cluster) >= cluster_min:
        clusters.append(current_cluster)

    cluster_details = []
    total_impulsive = 0
    for cluster in clusters:
        first_open = _get_open_time(cluster[0])
        last_open = _get_open_time(cluster[-1])
        cluster_pnl = sum(_get_profit(t) for t in cluster)
        total_impulsive += len(cluster)

        cluster_details.append({
            'trade_count': len(cluster),
            'start_time': first_open.isoformat() if first_open else None,
            'end_time': last_open.isoformat() if last_open else None,
            'duration_seconds': round((last_open - first_open).total_seconds()) if first_open and last_open else 0,
            'symbols': list(set(_get_symbol(t) for t in cluster)),
            'pnl': round(cluster_pnl, 2),
            'tickets': [_get_ticket(t) for t in cluster]
        })

    return {
        'rate': round(total_impulsive / max(1, len(trades)), 4),
        'cluster_count': len(clusters),
        'total_impulsive_trades': total_impulsive,
        'avg_gap_seconds': round(sum(all_gaps) / max(1, len(all_gaps)), 1) if all_gaps else 0,
        'clusters': cluster_details,
        'insufficient_data': False
    }


# ─── MENTAL BATTERY (COMPOSITE SCORE) ─────────────────────────────────────────

def calculate_mental_battery(trades, weights=None):
    """
    Calculate composite Mental Battery score from all behavioral signals.

    Formula:
        battery = 100 - (w1*revenge_penalty + w2*early_exit_penalty
                       + w3*overtrading_penalty + w4*impulsive_penalty
                       + w5*loss_streak_penalty)
                 + bonus(win_rate, profit_factor)

    Returns:
        dict with percentage, level, message, factors
    """
    if weights is None:
        weights = {
            'revenge': 0.25,
            'early_exit': 0.15,
            'overtrading': 0.20,
            'impulsive': 0.15,
            'loss_streak': 0.10,
            'win_rate_bonus': 0.10,
            'profit_factor_bonus': 0.05
        }

    if not trades or len(trades) < 3:
        return {
            'percentage': 50,
            'level': 'unknown',
            'message': 'Not enough trading data for analysis. Sync more trades.',
            'factors': [],
            'insufficient_data': True
        }

    # Run all detections
    revenge = detect_revenge_trading(trades)
    early_exit = detect_early_exits(trades)
    overtrading = detect_overtrading(trades)
    impulsive = detect_impulsive_entries(trades)

    # Calculate penalties (0-100 scale each)
    revenge_penalty = min(100, revenge['count'] * 15) * weights['revenge']
    early_exit_penalty = min(100, early_exit['rate'] * 200) * weights['early_exit']
    overtrading_penalty = min(100, overtrading['overtrading_days'] * 20) * weights['overtrading']
    impulsive_penalty = min(100, impulsive['rate'] * 200) * weights['impulsive']

    # Loss streak penalty
    loss_streak = _calculate_max_loss_streak(trades)
    loss_streak_penalty = min(100, loss_streak * 12) * weights['loss_streak']

    # Bonuses
    total_trades = len(trades)
    winning_trades = sum(1 for t in trades if _get_profit(t) > 0)
    win_rate = winning_trades / total_trades if total_trades > 0 else 0

    total_wins = sum(_get_profit(t) for t in trades if _get_profit(t) > 0)
    total_losses_abs = abs(sum(_get_profit(t) for t in trades if _get_profit(t) < 0))
    profit_factor = total_wins / max(0.01, total_losses_abs)

    win_rate_bonus = min(15, win_rate * 20) * weights['win_rate_bonus']
    pf_bonus = min(10, min(profit_factor, 3) * 3.3) * weights['profit_factor_bonus']

    # Composite
    total_penalty = revenge_penalty + early_exit_penalty + overtrading_penalty + impulsive_penalty + loss_streak_penalty
    total_bonus = win_rate_bonus + pf_bonus
    battery = max(0, min(100, round(100 - total_penalty + total_bonus)))

    # Level & message
    if battery >= 75:
        level = 'strong'
        message = "You're trading with strong mental clarity. Keep this discipline."
    elif battery >= 50:
        level = 'stable'
        message = 'Your trading psychology is steady. Stay mindful of patterns.'
    elif battery >= 30:
        level = 'strained'
        message = 'Signs of psychological strain detected. Consider a break.'
    else:
        level = 'low'
        message = 'High risk of emotional trading. Step away and reset.'

    # Build factors breakdown
    factors = []
    if revenge['detected']:
        factors.append({
            'name': 'Revenge Trading',
            'impact': 'negative',
            'severity': revenge['severity'],
            'detail': f"{revenge['count']} revenge trades detected",
            'penalty': round(revenge_penalty, 1)
        })
    if early_exit['count'] > 0:
        factors.append({
            'name': 'Early Exits',
            'impact': 'negative',
            'severity': 'medium' if early_exit['rate'] > 0.2 else 'low',
            'detail': f"{early_exit['count']} early exits ({round(early_exit['rate'] * 100, 1)}%)",
            'penalty': round(early_exit_penalty, 1)
        })
    if overtrading['detected']:
        factors.append({
            'name': 'Overtrading',
            'impact': 'negative',
            'severity': 'high' if overtrading['overtrading_days'] > 3 else 'medium',
            'detail': f"{overtrading['overtrading_days']} overtrading days detected",
            'penalty': round(overtrading_penalty, 1)
        })
    if impulsive['cluster_count'] > 0:
        factors.append({
            'name': 'Impulsive Entries',
            'impact': 'negative',
            'severity': 'medium' if impulsive['rate'] > 0.15 else 'low',
            'detail': f"{impulsive['cluster_count']} rapid-fire clusters",
            'penalty': round(impulsive_penalty, 1)
        })
    if win_rate > 0.5:
        factors.append({
            'name': 'Win Rate',
            'impact': 'positive',
            'severity': 'none',
            'detail': f"{round(win_rate * 100, 1)}% win rate",
            'bonus': round(win_rate_bonus, 1)
        })
    if profit_factor > 1.5:
        factors.append({
            'name': 'Profit Factor',
            'impact': 'positive',
            'severity': 'none',
            'detail': f"{round(profit_factor, 2)}x profit factor",
            'bonus': round(pf_bonus, 1)
        })

    return {
        'percentage': battery,
        'level': level,
        'message': message,
        'factors': factors,
        'details': {
            'revenge': revenge,
            'early_exits': early_exit,
            'overtrading': overtrading,
            'impulsive_entries': impulsive,
            'win_rate': round(win_rate, 4),
            'profit_factor': round(profit_factor, 2),
            'max_loss_streak': loss_streak,
            'total_trades': total_trades
        },
        'insufficient_data': False
    }


# ─── COACH ADVICE ─────────────────────────────────────────────────────────────

def get_coach_advice(trades):
    """
    Generate Coach Advice based on the most recent 10 trades.
    Priority: Revenge > Overtrading (Impulsive) > Lot Size Increase > Early Exit > Clean

    Returns: { error_type: str, lines: str[], severity: str }
    """
    if not trades:
        return {
            "error_type": "clean",
            "severity": "none",
            "lines": [
                "No recent trading data available.",
                "Sync your MT5 account to get personalized advice."
            ]
        }

    # Get last 10 trades sorted by close time
    sorted_trades = sorted(trades, key=lambda t: _get_close_time(t) or datetime.min)
    recent_trades = sorted_trades[-10:]
    
    # 1. Revenge Trading (highest priority)
    revenge = detect_revenge_trading(recent_trades)
    if revenge.get('count', 0) > 0:
        return {
            "error_type": "revenge_trading",
            "severity": "high",
            "lines": [
                "Rapid re-entry detected immediately after a stop-loss.",
                "You are exhibiting revenge trading behavior.",
                "Step away from the chart for 15 minutes."
            ]
        }
        
    # 2. Overtrading (Nhồi lệnh nhanh - mapped to impulsive entries logic)
    impulsive = detect_impulsive_entries(recent_trades, cluster_min=2)
    if impulsive.get('cluster_count', 0) > 0:
        x_trades = impulsive.get('total_impulsive_trades', 0)
        return {
            "error_type": "overtrading",
            "severity": "high",
            "lines": [
                f"{x_trades} rapid re-entries detected within a short window.",
                "You're entering trades too quickly.",
                "Pause until a fresh setup forms before entering again."
            ]
        }
        
    # 3. Lot Size Increase
    if len(recent_trades) >= 3:
        vol1 = _get_volume(recent_trades[-3])
        vol2 = _get_volume(recent_trades[-2])
        vol3 = _get_volume(recent_trades[-1])
        if vol3 > vol2 and vol2 > vol1:
            return {
                "error_type": "lot_size_increase",
                "severity": "medium",
                "lines": [
                    "Lot sizes have steadily increased in recent trades.",
                    "You are risking more than your standard trading plan."
                ]
            }
            
    # 4. Early Exit
    early_exits = detect_early_exits(recent_trades, min_trades=1)
    if early_exits.get('count', 0) > 0:
        return {
            "error_type": "early_exit",
            "severity": "low",
            "lines": [
                "Recent winning trades were closed significantly early.",
                "You are leaving potential profits on the table."
            ]
        }
        
    # Default (Clean)
    return {
        "error_type": "clean",
        "severity": "none",
        "lines": [
            "Recent trading data shows steady and controlled behavior.",
            "Keep sticking strictly to your trading plan."
        ]
    }


# ─── FULL ANALYSIS (convenience wrapper) ──────────────────────────────────────

def run_full_analysis(trades):
    """Run all behavioral analyses and return combined results."""
    return {
        'revenge_trading': detect_revenge_trading(trades),
        'early_exits': detect_early_exits(trades),
        'overtrading': detect_overtrading(trades),
        'impulsive_entries': detect_impulsive_entries(trades),
        'mental_battery': calculate_mental_battery(trades),
        'trade_count': len(trades),
        'analyzed_at': datetime.utcnow().isoformat() + 'Z'
    }


# ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

def _get_open_time(trade):
    """Extract open/entry time from trade dict (handles multiple field names)."""
    return _parse_time(
        trade.get('open_time', trade.get('openTime', trade.get('entryTime')))
    )


def _get_close_time(trade):
    """Extract close/exit time from trade dict (handles multiple field names)."""
    return _parse_time(
        trade.get('close_time', trade.get('closeTime', trade.get('exitTime')))
    )

def _parse_time(value):
    """Parse various time formats to datetime."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, (int, float)):
        try:
            return datetime.utcfromtimestamp(value)
        except (ValueError, OSError):
            return None
    if isinstance(value, str):
        for fmt in ('%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%dT%H:%M:%SZ',
                    '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S',
                    '%Y-%m-%dT%H:%M:%S.%f+00:00', '%Y-%m-%dT%H:%M:%S+00:00'):
            try:
                return datetime.strptime(value, fmt)
            except ValueError:
                continue
    return None


def _get_profit(trade):
    """Extract profit from trade dict (handles various key names)."""
    for key in ('profit', 'profitLoss', 'net_profit', 'netProfit', 'pnl'):
        if key in trade and trade[key] is not None:
            try:
                return float(trade[key])
            except (ValueError, TypeError):
                pass
    return 0.0


def _get_volume(trade):
    """Extract volume from trade dict."""
    for key in ('volume', 'lot', 'lots', 'size'):
        if key in trade and trade[key] is not None:
            try:
                return float(trade[key])
            except (ValueError, TypeError):
                pass
    return 0.01


def _get_symbol(trade):
    """Extract symbol from trade dict."""
    return trade.get('symbol', trade.get('mt5Symbol', trade.get('pair', '')))


def _get_ticket(trade):
    """Extract ticket/id from trade dict."""
    for key in ('ticket', 'id', '_id', 'trade_id', 'tradeId', 'positionId', 'position_id', 'mt5DealId'):
        if key in trade and trade[key] is not None:
            return trade[key]
    return None


def _get_duration(trade):
    """Extract or calculate duration in seconds."""
    # Direct duration field
    for key in ('duration_seconds', 'durationSeconds', 'duration'):
        if key in trade and trade[key] is not None:
            try:
                return float(trade[key])
            except (ValueError, TypeError):
                pass

    # Calculate from open/close times (support multiple field naming conventions)
    open_time = _parse_time(
        trade.get('open_time', trade.get('openTime', trade.get('entryTime')))
    )
    close_time = _parse_time(
        trade.get('close_time', trade.get('closeTime', trade.get('exitTime')))
    )
    if open_time and close_time:
        return max(0, (close_time - open_time).total_seconds())

    return 0


def _calculate_max_loss_streak(trades):
    """Calculate the maximum consecutive loss streak."""
    sorted_trades = sorted(trades, key=lambda t: _get_close_time(t) or datetime.min)
    max_streak = 0
    current_streak = 0
    for t in sorted_trades:
        if _get_profit(t) < 0:
            current_streak += 1
            max_streak = max(max_streak, current_streak)
        else:
            current_streak = 0
    return max_streak
