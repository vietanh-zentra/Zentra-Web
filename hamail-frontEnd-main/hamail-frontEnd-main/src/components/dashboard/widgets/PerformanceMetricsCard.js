"use client";
import { useState, useEffect } from "react";
import { apiClient } from "@/utils/api";

/**
 * FEAT-05: Performance Metrics Widget
 * Shows Sharpe, PF, MDD, Win Rate, Expectancy, streaks, etc.
 */
export default function PerformanceMetricsCard() {
  const [perf, setPerf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPerf = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getPerformance();
        setPerf(data.performance || data);
        setError(null);
      } catch (err) {
        setError(err.message || "Failed to load performance data");
      } finally {
        setLoading(false);
      }
    };
    fetchPerf();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl p-6 backdrop-blur-xl animate-pulse"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.25) 100%)",
          border: "1px solid rgba(255,255,255,0.2)",
          boxShadow: "0 8px 32px rgba(0,0,128,0.08)",
        }}>
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error || !perf) {
    return (
      <div className="rounded-2xl p-6 backdrop-blur-xl"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.25) 100%)",
          border: "1px solid rgba(255,255,255,0.2)",
          boxShadow: "0 8px 32px rgba(0,0,128,0.08)",
        }}>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Performance Metrics</h3>
        <p className="text-sm text-gray-500">
          {error || "Sync trades to see performance analytics"}
        </p>
      </div>
    );
  }

  const fmt = (val, dec = 2) => {
    if (val == null || isNaN(val)) return "—";
    return Number(val).toFixed(dec);
  };

  const fmtCurrency = (val) => {
    if (val == null) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
  };

  // KPI color helpers
  const winRateColor = (perf.winRate ?? 0) >= 55 ? "text-emerald-600" : (perf.winRate ?? 0) >= 45 ? "text-amber-500" : "text-red-500";
  const pfColor = (perf.profitFactor ?? 0) >= 1.5 ? "text-emerald-600" : (perf.profitFactor ?? 0) >= 1 ? "text-amber-500" : "text-red-500";
  const sharpeColor = (perf.sharpeRatio ?? 0) >= 1 ? "text-emerald-600" : (perf.sharpeRatio ?? 0) >= 0.5 ? "text-amber-500" : "text-red-500";
  const expectColor = (perf.expectancy ?? 0) > 0 ? "text-emerald-600" : "text-red-500";

  const kpis = [
    { label: "Win Rate", value: `${fmt(perf.winRate, 1)}%`, color: winRateColor, icon: "🎯" },
    { label: "Profit Factor", value: fmt(perf.profitFactor), color: pfColor, icon: "📊" },
    { label: "Sharpe Ratio", value: fmt(perf.sharpeRatio), color: sharpeColor, icon: "⚡" },
    { label: "Max Drawdown", value: fmtCurrency(perf.maxDrawdown), color: "text-red-500", icon: "📉" },
    { label: "Expectancy", value: fmtCurrency(perf.expectancy), color: expectColor, icon: "💰" },
    { label: "Recovery Factor", value: fmt(perf.recoveryFactor), color: "text-gray-900", icon: "🔄" },
  ];

  const details = [
    { label: "Total Trades", value: perf.totalTrades ?? 0 },
    { label: "Winning", value: perf.winningTrades ?? 0 },
    { label: "Losing", value: perf.losingTrades ?? 0 },
    { label: "Net P/L", value: fmtCurrency(perf.netProfitLoss) },
    { label: "Best Trade", value: fmtCurrency(perf.bestTrade) },
    { label: "Worst Trade", value: fmtCurrency(perf.worstTrade) },
    { label: "Avg Win", value: fmtCurrency(perf.averageWin) },
    { label: "Avg Loss", value: fmtCurrency(perf.averageLoss) },
    { label: "Win Streak", value: perf.maxWinStreak ?? 0 },
    { label: "Loss Streak", value: perf.maxLossStreak ?? 0 },
  ];

  return (
    <div
      className="rounded-2xl p-6 backdrop-blur-xl transition-all duration-300"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.25) 100%)",
        border: "1px solid rgba(255,255,255,0.2)",
        boxShadow: "0 8px 32px rgba(0,0,128,0.08)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-gray-900">Performance Metrics</h3>
        <span className="text-xs text-gray-400">
          {perf.tradesAnalyzed ?? perf.totalTrades ?? 0} trades analyzed
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white/50 rounded-xl p-3 text-center transition-transform hover:scale-105 duration-200"
          >
            <span className="text-lg">{kpi.icon}</span>
            <p className={`text-xl font-bold ${kpi.color} mt-1`}>{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-2 gap-2">
        {details.map((item) => (
          <div key={item.label} className="flex items-center justify-between px-3 py-1.5 bg-white/30 rounded-lg">
            <span className="text-xs text-gray-500">{item.label}</span>
            <span className="text-xs font-semibold text-gray-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
