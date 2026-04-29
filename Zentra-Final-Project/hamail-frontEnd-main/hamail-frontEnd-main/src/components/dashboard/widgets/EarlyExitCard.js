"use client";
import { motion } from "framer-motion";
import CardIconTooltip from "./CardIconTooltip";

export default function EarlyExitCard({ data, loading = false }) {
  const isEmpty = !data || data.insufficient_data || data.count === 0;

  const CardWrapper = ({ children }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#ECF1F1] rounded-[20px] p-5 shadow-sm border border-[#FFFFFF] flex flex-col relative overflow-hidden"
    >
      {children}
    </motion.div>
  );

  if (loading) {
    return (
      <CardWrapper>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-[#363636]">Early Exits</h3>
        </div>
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-teal-500 rounded-full animate-spin" />
        </div>
      </CardWrapper>
    );
  }

  // Format seconds to human-readable
  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return "—";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const ratePercent = ((data?.rate || 0) * 100).toFixed(1);

  return (
    <CardWrapper>
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium text-[#363636]">Early Exits</h3>
        <CardIconTooltip
          title="Early Exits"
          tooltipText="Detects when you close winning trades too early — exiting with less profit than your average winner and much shorter holding time."
          position="bottom"
        >
          <div className="w-9 h-9 rounded-full bg-[#F2F7F7] border border-[#FFFFFF] flex items-center justify-center shadow-sm cursor-help">
            <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-[#363636]">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
        </CardIconTooltip>
      </div>

      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
          <div className="text-3xl mb-2">💎</div>
          <p className="text-sm font-medium text-gray-600">No early exits detected</p>
          <p className="text-xs text-gray-400 mt-1">You're letting winners run — great patience!</p>
        </div>
      ) : (
        <>
          {/* Main metric: Rate */}
          <div className="flex items-end gap-2 mb-4">
            <motion.span
              className="text-3xl font-bold text-gray-800"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              {ratePercent}%
            </motion.span>
            <span className="text-sm text-gray-500 mb-1">early exit rate</span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white/60 rounded-xl p-2.5 text-center">
              <div className="text-base font-semibold text-gray-800">{data.count}</div>
              <div className="text-[9px] text-gray-500 uppercase tracking-wider">Early Exits</div>
            </div>
            <div className="bg-white/60 rounded-xl p-2.5 text-center">
              <div className="text-base font-semibold text-amber-600">
                ${Math.abs(data.potential_missed_profit || 0).toFixed(0)}
              </div>
              <div className="text-[9px] text-gray-500 uppercase tracking-wider">Missed Profit</div>
            </div>
            <div className="bg-white/60 rounded-xl p-2.5 text-center">
              <div className="text-base font-semibold text-gray-800">
                {formatDuration(data.avg_early_exit_duration_sec)}
              </div>
              <div className="text-[9px] text-gray-500 uppercase tracking-wider">Avg Hold</div>
            </div>
          </div>

          {/* Comparison bar: avg exit vs avg winner */}
          {data.avg_winner_duration_sec > 0 && (
            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-2">Exit time vs average winner</div>
              <div className="relative h-6 bg-white/40 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-300 to-amber-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(100, ((data.avg_early_exit_duration_sec || 0) / data.avg_winner_duration_sec) * 100)}%`,
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-medium">
                  <span className="text-gray-700">
                    {formatDuration(data.avg_early_exit_duration_sec)} early
                  </span>
                  <span className="text-gray-500">
                    {formatDuration(data.avg_winner_duration_sec)} avg
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Recent early exits */}
          {data.trades && data.trades.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recent</div>
              {data.trades.slice(-3).map((trade, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-2 bg-white/50 rounded-lg px-3 py-2 text-xs"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                  <span className="text-gray-600 font-medium">{trade.symbol || "—"}</span>
                  <span className="text-gray-400 ml-auto">{formatDuration(trade.duration_seconds)}</span>
                  <span className="text-emerald-600 font-semibold">+{trade.profit?.toFixed(2)}</span>
                  <span className="text-red-400 text-[10px]">(-${trade.missed_profit?.toFixed(0)})</span>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </CardWrapper>
  );
}
