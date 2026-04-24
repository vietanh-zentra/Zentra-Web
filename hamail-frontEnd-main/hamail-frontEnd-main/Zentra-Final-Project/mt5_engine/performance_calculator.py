"""
Performance Calculator Module — Phase H-NEW-8

Computes all performance metrics from trade history:
Sharpe Ratio, Profit Factor, Max Drawdown, Recovery Factor,
Win/Loss Streaks, Expectancy, Average Hold Time, etc.

Author: Hoà (MT5 Engine Lead)
"""
import math
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class PerformanceCalculator:
    """
    Calculates comprehensive trading performance metrics from a list of trades.

    Input: List of normalized trade dicts (from DataNormalizer.transform_to_contract)
    Output: Dict with all performance metrics matching MT5's built-in report.
    """

    @staticmethod
    def calculate_all(trades: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Master method — calculates ALL performance metrics at once.

        Args:
            trades: List of normalized trade dicts with keys:
                    net_profit, profit, commission, swap, volume,
                    open_time, close_time, duration_seconds, trade_type, symbol

        Returns:
            Dict with all metrics. See inline comments for each metric.
        """
        if not trades:
            logger.info("[PERF] No trades to analyze")
            return PerformanceCalculator._empty_metrics()

        logger.info(f"[PERF] Calculating metrics for {len(trades)} trades")

        # Separate wins and losses
        profits = [t["net_profit"] for t in trades]
        wins = [p for p in profits if p > 0]
        losses = [p for p in profits if p <= 0]

        # Trade type breakdown
        buys = [t for t in trades if t.get("trade_type") == "BUY"]
        sells = [t for t in trades if t.get("trade_type") == "SELL"]

        # Symbol breakdown
        symbols = {}
        for t in trades:
            sym = t.get("symbol", "Unknown")
            if sym not in symbols:
                symbols[sym] = {"count": 0, "net_profit": 0.0, "volume": 0.0}
            symbols[sym]["count"] += 1
            symbols[sym]["net_profit"] += t["net_profit"]
            symbols[sym]["volume"] += t.get("volume", 0.0)

        # Time analysis
        durations = [t.get("duration_seconds", 0) for t in trades if t.get("duration_seconds", 0) > 0]

        # Core calculations
        total_trades = len(trades)
        win_count = len(wins)
        loss_count = len(losses)
        net_pl = round(sum(profits), 2)
        gross_profit = round(sum(wins), 2) if wins else 0.0
        gross_loss = round(sum(losses), 2) if losses else 0.0
        total_commission = round(sum(t.get("commission", 0) for t in trades), 2)
        total_swap = round(sum(t.get("swap", 0) for t in trades), 2)
        total_volume = round(sum(t.get("volume", 0) for t in trades), 4)

        # Ratios
        win_rate = round((win_count / total_trades) * 100, 2) if total_trades > 0 else 0.0
        avg_profit = round(net_pl / total_trades, 2) if total_trades > 0 else 0.0
        avg_win = round(sum(wins) / win_count, 2) if win_count > 0 else 0.0
        avg_loss = round(sum(losses) / loss_count, 2) if loss_count > 0 else 0.0

        # Profit Factor
        profit_factor = round(abs(gross_profit / gross_loss), 2) if gross_loss != 0 else float('inf') if gross_profit > 0 else 0.0

        # Sharpe Ratio (annualized, using daily returns approximation)
        sharpe_ratio = PerformanceCalculator._sharpe_ratio(profits)

        # Max Drawdown
        max_drawdown, max_drawdown_pct = PerformanceCalculator._max_drawdown(profits)

        # Recovery Factor
        recovery_factor = round(abs(net_pl / max_drawdown), 2) if max_drawdown != 0 else 0.0

        # Streaks
        max_win_streak, max_loss_streak = PerformanceCalculator._streaks(profits)

        # Expectancy
        expectancy = PerformanceCalculator._expectancy(win_rate, avg_win, avg_loss)

        # Payoff Ratio (avg win / avg loss)
        payoff_ratio = round(abs(avg_win / avg_loss), 2) if avg_loss != 0 else 0.0

        # Best / Worst trade
        best_trade = round(max(profits), 2) if profits else 0.0
        worst_trade = round(min(profits), 2) if profits else 0.0

        # Average hold time
        avg_hold_time_seconds = round(sum(durations) / len(durations)) if durations else 0

        # Trades per week (based on date range)
        trades_per_week = PerformanceCalculator._trades_per_week(trades)

        # Long vs Short stats
        long_profit = round(sum(t["net_profit"] for t in buys), 2)
        short_profit = round(sum(t["net_profit"] for t in sells), 2)

        result = {
            # --- Summary ---
            "totalTrades": total_trades,
            "winningTrades": win_count,
            "losingTrades": loss_count,
            "winRate": win_rate,

            # --- P/L ---
            "netProfitLoss": net_pl,
            "grossProfit": gross_profit,
            "grossLoss": gross_loss,
            "averageProfitLoss": avg_profit,
            "averageWin": avg_win,
            "averageLoss": avg_loss,
            "bestTrade": best_trade,
            "worstTrade": worst_trade,
            "totalCommission": total_commission,
            "totalSwap": total_swap,
            "totalVolume": total_volume,

            # --- Risk Metrics ---
            "profitFactor": profit_factor if profit_factor != float('inf') else 9999.99,
            "sharpeRatio": sharpe_ratio,
            "maxDrawdown": max_drawdown,
            "maxDrawdownPercent": max_drawdown_pct,
            "recoveryFactor": recovery_factor,
            "payoffRatio": payoff_ratio,
            "expectancy": expectancy,

            # --- Streaks ---
            "maxWinStreak": max_win_streak,
            "maxLossStreak": max_loss_streak,

            # --- Time ---
            "averageHoldTimeSeconds": avg_hold_time_seconds,
            "tradesPerWeek": trades_per_week,

            # --- Long vs Short ---
            "longTrades": len(buys),
            "shortTrades": len(sells),
            "longProfit": long_profit,
            "shortProfit": short_profit,

            # --- By Symbol ---
            "bySymbol": {
                sym: {
                    "count": data["count"],
                    "netProfit": round(data["net_profit"], 2),
                    "volume": round(data["volume"], 4),
                }
                for sym, data in sorted(symbols.items(), key=lambda x: x[1]["net_profit"], reverse=True)
            },
        }

        logger.info(f"[PERF] Metrics complete: netPL={net_pl}, winRate={win_rate}%, "
                     f"sharpe={sharpe_ratio}, PF={profit_factor}, MDD={max_drawdown}")
        return result

    @staticmethod
    def _sharpe_ratio(profits: List[float]) -> float:
        """Annualized Sharpe Ratio (simplified, risk-free = 0)."""
        if len(profits) < 2:
            return 0.0
        mean_return = sum(profits) / len(profits)
        variance = sum((p - mean_return) ** 2 for p in profits) / (len(profits) - 1)
        std_dev = math.sqrt(variance) if variance > 0 else 0.0
        if std_dev == 0:
            return 0.0
        # Annualize: assume ~252 trading days
        sharpe = (mean_return / std_dev) * math.sqrt(min(len(profits), 252))
        return round(sharpe, 2)

    @staticmethod
    def _max_drawdown(profits: List[float]) -> tuple:
        """
        Calculate maximum drawdown (absolute and percentage).

        Returns:
            (max_drawdown_absolute, max_drawdown_percent)
        """
        if not profits:
            return 0.0, 0.0

        cumulative = []
        running = 0.0
        for p in profits:
            running += p
            cumulative.append(running)

        peak = cumulative[0]
        max_dd = 0.0

        for value in cumulative:
            if value > peak:
                peak = value
            dd = peak - value
            if dd > max_dd:
                max_dd = dd

        max_dd_pct = round((max_dd / peak) * 100, 2) if peak > 0 else 0.0
        return round(max_dd, 2), max_dd_pct

    @staticmethod
    def _streaks(profits: List[float]) -> tuple:
        """Calculate max consecutive win and loss streaks."""
        if not profits:
            return 0, 0

        max_win = max_loss = 0
        cur_win = cur_loss = 0

        for p in profits:
            if p > 0:
                cur_win += 1
                cur_loss = 0
            else:
                cur_loss += 1
                cur_win = 0
            max_win = max(max_win, cur_win)
            max_loss = max(max_loss, cur_loss)

        return max_win, max_loss

    @staticmethod
    def _expectancy(win_rate: float, avg_win: float, avg_loss: float) -> float:
        """Calculate mathematical expectancy per trade."""
        wr = win_rate / 100.0
        lr = 1.0 - wr
        return round((wr * avg_win) + (lr * avg_loss), 2)

    @staticmethod
    def _trades_per_week(trades: List[Dict]) -> float:
        """Calculate average trades per week based on date range."""
        if len(trades) < 2:
            return len(trades)

        try:
            times = []
            for t in trades:
                ot = t.get("open_time", "")
                if isinstance(ot, str) and ot:
                    times.append(datetime.fromisoformat(ot.replace("Z", "+00:00")))
            if len(times) < 2:
                return len(trades)
            span_days = (max(times) - min(times)).total_seconds() / 86400
            weeks = max(span_days / 7, 1)
            return round(len(trades) / weeks, 1)
        except Exception:
            return round(len(trades), 1)

    @staticmethod
    def _empty_metrics() -> Dict[str, Any]:
        """Return zero-valued metrics when no trades exist."""
        return {
            "totalTrades": 0, "winningTrades": 0, "losingTrades": 0,
            "winRate": 0.0, "netProfitLoss": 0.0, "grossProfit": 0.0,
            "grossLoss": 0.0, "averageProfitLoss": 0.0, "averageWin": 0.0,
            "averageLoss": 0.0, "bestTrade": 0.0, "worstTrade": 0.0,
            "totalCommission": 0.0, "totalSwap": 0.0, "totalVolume": 0.0,
            "profitFactor": 0.0, "sharpeRatio": 0.0, "maxDrawdown": 0.0,
            "maxDrawdownPercent": 0.0, "recoveryFactor": 0.0,
            "payoffRatio": 0.0, "expectancy": 0.0,
            "maxWinStreak": 0, "maxLossStreak": 0,
            "averageHoldTimeSeconds": 0, "tradesPerWeek": 0.0,
            "longTrades": 0, "shortTrades": 0,
            "longProfit": 0.0, "shortProfit": 0.0,
            "bySymbol": {},
        }
