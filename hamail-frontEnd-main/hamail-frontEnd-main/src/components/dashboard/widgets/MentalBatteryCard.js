"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import CardIconTooltip from "./CardIconTooltip";

// ─── SVG Arc Gauge ───────────────────────────────────────────────
function ArcGauge({ percentage, level }) {
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const size = 220;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Arc from 225° (bottom-left) to -45° (bottom-right) = 270° sweep
  const startAngle = 135;   // degrees (bottom-left)
  const totalSweep = 270;   // degrees

  const polarToCartesian = (angleDeg) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  };

  const describeArc = (start, end) => {
    const s = polarToCartesian(end);
    const e = polarToCartesian(start);
    const sweep = end - start <= 180 ? "0" : "1";
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${sweep} 0 ${e.x} ${e.y}`;
  };

  const endAngle = startAngle + (totalSweep * clampedPct) / 100;
  const bgPath = describeArc(startAngle, startAngle + totalSweep);
  const fgPath = clampedPct > 0 ? describeArc(startAngle, endAngle) : "";

  // Gradient ID
  const gradientId = "battery-arc-gradient";

  // Glow color based on level
  const glowColor =
    level === "Low" ? "#AAFFEF" : level === "Strong" ? "#00BFA6" : "#30EDCF";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${glowColor}30 0%, transparent 70%)`,
        }}
        animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF6B6B" />
            <stop offset="35%" stopColor="#FFD93D" />
            <stop offset="65%" stopColor="#30EDCF" />
            <stop offset="100%" stopColor="#00BFA6" />
          </linearGradient>
          <filter id="arc-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background arc */}
        <path
          d={bgPath}
          fill="none"
          stroke="#D5E0E0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Foreground arc — animated */}
        {clampedPct > 0 && (
          <motion.path
            d={fgPath}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter="url(#arc-glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-[42px] font-bold text-gray-800 leading-none tracking-tight"
          key={clampedPct}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {clampedPct}%
        </motion.span>
      </div>
    </div>
  );
}

// ─── Status Messages ─────────────────────────────────────────────
const STATUS_MESSAGES = {
  Strong: "You're performing at peak — ride the momentum",
  Stable: "Steady state — stay focused and disciplined",
  Low: "Energy drained — consider taking a break",
};

// ─── Main Component ──────────────────────────────────────────────
export default function MentalBatteryCard({
  percentage = 45,
  level = "Stable",
  message,
  hasNoTrades = false,
}) {
  const batteryLevel = Math.min(100, Math.max(0, percentage));

  const getNormalizedLevel = (l, p) => {
    const lower = l?.toLowerCase();
    if (lower === "optimal" || lower === "strong" || p >= 66)
      return { label: "Strong", index: 2 };
    if (
      lower === "strained" ||
      lower === "low" ||
      lower === "high risk" ||
      lower === "high_risk" ||
      p < 33
    )
      return { label: "Low", index: 0 };
    return { label: "Stable", index: 1 };
  };

  const { label: displayLevel, index: activeIndex } = getNormalizedLevel(
    level,
    batteryLevel
  );

  const statusBars = [
    { label: "Low", color: "#AAFFEF", dotColor: "#B2FFF0" },
    { label: "Stable", color: "#30EDCF", dotColor: "#37E3C0" },
    { label: "Strong", color: "#00BFA6", dotColor: "#00BFA6" },
  ];

  // Dynamic status message
  const statusMessage = message || STATUS_MESSAGES[displayLevel] || "";

  // Card wrapper with entrance animation
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

  // ── No-data state ──────────────────────────────────────────────
  if (hasNoTrades) {
    return (
      <CardWrapper>
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-medium text-gray-700">Mental Battery</h3>
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
            <BatteryIcon className="text-gray-400" />
          </div>
        </div>

        {/* Empty gauge */}
        <div className="flex-1 flex flex-col items-center justify-center py-3">
          <div className="opacity-30">
            <ArcGauge percentage={0} level="Low" />
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">
            No data available for this date
          </p>
        </div>

        {/* Status bars dimmed */}
        <div className="grid grid-cols-3 mt-2">
          {statusBars.map((bar) => (
            <div key={bar.label} className="flex flex-col items-center gap-2">
              <div
                className="w-full h-11 rounded-2xl"
                style={{ backgroundColor: bar.color, opacity: 0.15 }}
              />
              <span className="text-[12px] font-medium text-gray-400 uppercase tracking-wider">
                {bar.label}
              </span>
            </div>
          ))}
        </div>
      </CardWrapper>
    );
  }

  // ── Main render ────────────────────────────────────────────────
  return (
    <CardWrapper>
      {/* Header */}
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-xl font-medium text-[#363636]">Mental Battery</h3>
        <CardIconTooltip
          title="Mental Battery"
          tooltipText="Estimates your current mental energy based on recent activity. Helps you understand when you're operating at your sharpest."
          position="bottom"
        >
          <div className="w-10 h-10 rounded-full bg-[#F2F7F7] border border-[#FFFFFF] flex items-center justify-center shadow-sm cursor-help">
            <BatteryIcon className="text-[#363636]" />
          </div>
        </CardIconTooltip>
      </div>

      {/* Arc Gauge */}
      <div className="flex-1 flex items-center justify-center py-2">
        <ArcGauge percentage={batteryLevel} level={displayLevel} />
      </div>

      {/* Status Badge + Message */}
      <div className="flex flex-col items-center mb-3">
        {/* Badge */}
        <motion.div
          className="flex items-center gap-2 px-4 py-1.5 bg-white/60 backdrop-blur-sm rounded-full border border-white/60 text-sm font-semibold text-gray-600 shadow-sm mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <motion.span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: statusBars[activeIndex].dotColor }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          {displayLevel}
        </motion.div>

        {/* Dynamic message */}
        <AnimatePresence mode="wait">
          <motion.p
            key={displayLevel}
            className="text-xs text-gray-500 text-center px-2 leading-relaxed"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            {statusMessage}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Status Bars */}
      <div className="grid grid-cols-3">
        {statusBars.map((bar, index) => (
          <div key={bar.label} className="flex flex-col items-center gap-2">
            <motion.div
              className="w-full h-11 rounded-2xl transition-all duration-500"
              style={{
                backgroundColor: bar.color,
                opacity: index <= activeIndex ? 1 : 0.2,
                boxShadow:
                  index === activeIndex
                    ? `0 4px 14px ${bar.color}50`
                    : "none",
              }}
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
            />
            <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
              {bar.label}
            </span>
          </div>
        ))}
      </div>
    </CardWrapper>
  );
}

// ─── Battery Icon ────────────────────────────────────────────────
function BatteryIcon({ className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-battery-full ${className}`}
    >
      <path d="M10 10v4" />
      <path d="M14 10v4" />
      <path d="M22 14v-4" />
      <path d="M6 10v4" />
      <rect x="2" y="6" width="16" height="12" rx="2" />
    </svg>
  );
}