"use client";
import { motion } from "framer-motion";
import CardIconTooltip from "./CardIconTooltip";

export default function OvertradingCard({ data, loading = false }) {
  const isEmpty = !data || data.daily_breakdown?.length === 0;
  const hasOvertrading = data?.detected;

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
          <h3 className="text-lg font-medium text-[#363636]">Overtrading</h3>
        </div>
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-teal-500 rounded-full animate-spin" />
        </div>
      </CardWrapper>
    );
  }

  // Get max count for scaling bars
  const breakdown = data?.daily_breakdown || [];
  const maxCount = Math.max(...breakdown.map((d) => d.trade_count), 1);
  const threshold = data?.threshold || data?.daily_avg * 2 || 0;

  return (
    <CardWrapper>
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium text-[#363636]">Overtrading</h3>
        <CardIconTooltip
          title="Overtrading"
          tooltipText="Flags days when you trade significantly more than your daily average — a common sign of emotional or impulsive trading behavior."
          position="bottom"
        >
          <div className="w-9 h-9 rounded-full bg-[#F2F7F7] border border-[#FFFFFF] flex items-center justify-center shadow-sm cursor-help">
            <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-[#363636]">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
        </CardIconTooltip>
      </div>

      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
          <div className="text-3xl mb-2">📊</div>
          <p className="text-sm font-medium text-gray-600">No trading data yet</p>
          <p className="text-xs text-gray-400 mt-1">Sync trades to see daily patterns</p>
        </div>
      ) : (
        <>
          {/* Status Badge */}
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
                hasOvertrading
                  ? "bg-red-50 border-red-200 text-red-600"
                  : "bg-emerald-50 border-emerald-200 text-emerald-600"
              }`}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              <span>{hasOvertrading ? "⚠️" : "✅"}</span>
              {hasOvertrading
                ? `${data.overtrading_days} day${data.overtrading_days > 1 ? "s" : ""} flagged`
                : "Trading volume normal"}
            </motion.div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white/60 rounded-xl p-2.5 text-center">
              <div className="text-base font-semibold text-gray-800">
                {data.daily_avg?.toFixed(1) || "0"}
              </div>
              <div className="text-[9px] text-gray-500 uppercase tracking-wider">Daily Avg</div>
            </div>
            <div className="bg-white/60 rounded-xl p-2.5 text-center">
              <div className="text-base font-semibold text-gray-800">
                {data.peak_count || 0}
              </div>
              <div className="text-[9px] text-gray-500 uppercase tracking-wider">Peak Day</div>
            </div>
            <div className="bg-white/60 rounded-xl p-2.5 text-center">
              <div className="text-base font-semibold text-gray-800">
                {data.excess_trades || 0}
              </div>
              <div className="text-[9px] text-gray-500 uppercase tracking-wider">Excess</div>
            </div>
          </div>

          {/* Daily Breakdown Bar Chart */}
          {breakdown.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Daily Breakdown
              </div>
              <div className="flex items-end gap-1" style={{ height: 80 }}>
                {breakdown.slice(-14).map((day, i) => {
                  const barHeight = (day.trade_count / maxCount) * 100;
                  const isOver = day.is_overtrading;
                  return (
                    <motion.div
                      key={day.date}
                      className="flex-1 flex flex-col items-center gap-0.5 group relative"
                      initial={{ height: 0 }}
                      animate={{ height: "100%" }}
                      transition={{ delay: i * 0.05 }}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 bg-gray-800 text-white text-[9px] rounded px-2 py-1 whitespace-nowrap">
                        {day.date}: {day.trade_count} trades (${day.pnl?.toFixed(0)})
                      </div>
                      {/* Bar */}
                      <div className="w-full flex-1 flex items-end">
                        <motion.div
                          className={`w-full rounded-t-sm ${
                            isOver
                              ? "bg-gradient-to-t from-red-400 to-red-300"
                              : "bg-gradient-to-t from-teal-400 to-teal-300"
                          }`}
                          style={{ height: `${barHeight}%`, minHeight: 2 }}
                          initial={{ height: 0 }}
                          animate={{ height: `${barHeight}%` }}
                          transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                        />
                      </div>
                      {/* Date label (show for every other day) */}
                      {i % 2 === 0 && (
                        <span className="text-[7px] text-gray-400 leading-none mt-0.5">
                          {day.date.slice(5)}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              {/* Threshold line indicator */}
              {threshold > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-px flex-1 border-t border-dashed border-red-300" />
                  <span className="text-[9px] text-red-400">threshold: {threshold.toFixed(0)}</span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </CardWrapper>
  );
}
