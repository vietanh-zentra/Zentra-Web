"use client";
import { motion } from "framer-motion";
import StateShape from "./StateShape";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../tailwind.config.js";

const fullConfig = resolveConfig(tailwindConfig);
const colors = fullConfig.theme.colors;

// State configuration mapping
export const STATE_CONFIG = {
  stable: {
    name: "Stable",
    shape: "circle",
    gradient: { start: colors.tertiary, end: colors.primary },
    textColor: colors.tertiary,
  },
  focused: {
    name: "Stable",
    shape: "circle",
    gradient: { start: colors.tertiary, end: colors.primary },
    textColor: colors.tertiary,
  },
  overextended: {
    name: "Overextended",
    shape: "square",
    gradient: { start: "#fbbf24", end: "#f97316" },
    textColor: "#fbbf24",
  },
  overtrading: {
    name: "Overextended",
    shape: "square",
    gradient: { start: "#dc2626", end: "#b91c1c" }, // Red gradient for overtrading
    textColor: "#dc2626",
  },
  hesitant: {
    name: "Hesitant",
    shape: "triangle",
    gradient: { start: colors.hesitant || "#8b5cf6", end: colors.tertiary },
    textColor: colors.hesitant || "#8b5cf6",
  },
  aggressive: {
    name: "Aggressive",
    shape: "diamond",
    gradient: { start: "#f97316", end: "#ea580c" }, // Orange gradient for aggressive
    textColor: "#f97316",
  },
};

export default function StateIndicator({
  state,
  size = 160,
  showLabel = true,
  className = "",
  animate = true,
  delay = 0,
}) {
  const stateConfig = STATE_CONFIG[state] || STATE_CONFIG.stable;

  const content = (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <StateShape
        gradient={stateConfig.gradient}
        shape={stateConfig.shape}
        size={size}
      />
      {showLabel && (
        <span
          className="text-sm font-medium tracking-wide opacity-70"
          style={{ color: stateConfig.textColor }}
        >
          {stateConfig.name}
        </span>
      )}
    </div>
  );

  if (!animate) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.8,
        delay: delay,
        ease: "easeOut",
      }}
    >
      {content}
    </motion.div>
  );
}

