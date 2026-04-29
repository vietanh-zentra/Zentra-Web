"use client";
import { motion, AnimatePresence } from "framer-motion";
import CardIconTooltip from "./CardIconTooltip";

// Severity config
const SEVERITY_CONFIG = {
  high: { color: "#EF4444", bg: "bg-red-50", border: "border-red-200", label: "High Risk", icon: "🔴" },
  medium: { color: "#F59E0B", bg: "bg-amber-50", border: "border-amber-200", label: "Caution", icon: "🟡" },
  low: { color: "#10B981", bg: "bg-emerald-50", border: "border-emerald-200", label: "Low", icon: "🟢" },
  none: { color: "#6B7280", bg: "bg-gray-50", border: "border-gray-200", label: "None", icon: "✅" },
};

export default function RevengeTradingCard({ data, loading = false }) {
  const isEmpty = !data || data.insufficient_data || data.count === 0;
  const severity = SEVERITY_CONFIG[data?.severity] || SEVERITY_CONFIG.none;

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
          <h3 className="text-lg font-medium text-[#363636]">Revenge Trading</h3>
        </div>
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-teal-500 rounded-full animate-spin" />
        </div>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper>
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium text-[#363636]">Revenge Trading</h3>
        <CardIconTooltip
          title="Revenge Trading"
          tooltipText="Detects when you open trades immediately after a loss, often with larger size — a sign of emotional decision-making."
          position="bottom"
        >
          <div className="w-9 h-9 rounded-full bg-[#F2F7F7] border border-[#FFFFFF] flex items-center justify-center shadow-sm cursor-help">
            <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-[#363636]">
              <path d="M12 2v4" /><path d="m16 6-4 4-4-4" />
              <path d="M12 22v-4" /><path d="m8 18 4-4 4 4" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        </CardIconTooltip>
      </div>

      {isEmpty ? (
        /* No data state */
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-sm font-medium text-gray-600">No revenge trading detected</p>
          <p className="text-xs text-gray-400 mt-1">Great emotional discipline!</p>
        </div>
      ) : (
        <>
          {/* Severity Badge + Count */}
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              className={`px-3 py-1.5 rounded-full ${severity.bg} ${severity.border} border text-xs font-semibold flex items-center gap-1.5`}
              style={{ color: severity.color }}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <span>{severity.icon}</span>
              {severity.label}
            </motion.div>
            <div className="text-right ml-auto">
              <motion.span
                className="text-2xl font-bold text-gray-800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {data.count}
              </motion.span>
              <span className="text-xs text-gray-500 ml-1">instances</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-white/60 rounded-xl p-3 text-center">
              <div className="text-lg font-semibold text-gray-800">
                {((data.revenge_rate || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Revenge Rate</div>
            </div>
            <div className="bg-white/60 rounded-xl p-3 text-center">
              <div className="text-lg font-semibold text-gray-800">
                {data.total_losses || 0}
              </div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Total Losses</div>
            </div>
          </div>

          {/* Timeline — last 3 revenge trades */}
          {data.trades && data.trades.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recent Incidents</div>
              {data.trades.slice(-3).map((trade, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-2 bg-white/50 rounded-lg px-3 py-2 text-xs"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  <span className="text-gray-600 font-medium">{trade.symbol || "—"}</span>
                  <span className="text-gray-400 ml-auto">
                    {trade.time_gap_seconds ? `${Math.round(trade.time_gap_seconds / 60)}min gap` : ""}
                  </span>
                  <span className={`font-semibold ${trade.revenge_profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {trade.revenge_profit >= 0 ? "+" : ""}{trade.revenge_profit?.toFixed(2) || "0.00"}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </CardWrapper>
  );
}
