"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function CardIconTooltip({ children, tooltipText, title, variant = "light", position = "bottom" }) {
  const [isHovered, setIsHovered] = useState(false);

  // Determine if we're on a dark background (like ZentraBreathwork or QuoteOfTheDay)
  const isDark = variant === "dark";
  const isBottom = position === "bottom";

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: isBottom ? -5 : 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isBottom ? -5 : 5, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute right-1/2 -translate-x-1/2 z-[100] pointer-events-none whitespace-normal ${
              isBottom ? "top-full mt-2" : "bottom-full mb-2"
            }`}
            style={{ width: "max-content", maxWidth: "270px", minWidth: "200px" }}
          >
            <div
              className={`${
                isDark
                  ? "bg-white/95 backdrop-blur-md text-gray-900 border-gray-200/50"
                  : "bg-white/95 backdrop-blur-md text-gray-800 border-gray-200/50"
              } text-sm rounded-lg px-4 py-3 shadow-lg border`}
              style={{
                boxShadow:
                  "0 8px 32px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)",
              }}
            >
              {title && (
                <div className="font-semibold mb-1.5 text-gray-900">
                  {title}
                </div>
              )}
              <div className="leading-relaxed text-gray-700">
                {tooltipText}
              </div>
              {/* Arrow */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-transparent ${
                  isBottom
                    ? `top-0 -mt-1 border-b-4 border-b-white/95`
                    : `top-full border-t-4 border-t-white/95`
                }`}
              ></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
