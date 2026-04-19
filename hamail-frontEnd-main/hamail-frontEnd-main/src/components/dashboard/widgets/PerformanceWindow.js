"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { TrophyIcon } from "@heroicons/react/24/outline";
import CardIconTooltip from "./CardIconTooltip";
import { useState, useRef, useEffect } from "react";

export default function PerformanceWindow({
  daysStreak = 3,
  message,
  hasNoTrades = false,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef(null);
  
  const displayMessage = message || `You have followed your plan for ${daysStreak} ${daysStreak === 1 ? "day" : "days"} straight. Great Work.`;

  useEffect(() => {
    if (textRef.current) {
      // Check if content height exceeds the visible height (which is clamped by line-clamp)
      // We add a small buffer (1px) to account for sub-pixel rendering differences
      setIsOverflowing(textRef.current.scrollHeight > textRef.current.clientHeight + 1);
    }
  }, [displayMessage]);

  if (hasNoTrades) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 relative overflow-visible h-full flex flex-col"
        style={{
          boxShadow:
            "0 0 20px rgba(0, 191, 166, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <CardIconTooltip
            title="Performance Window"
            tooltipText="Evaluates your consistency over recent trades or days, tracking whether you're respecting risk limits, following setups, and maintaining composure. Helps you understand if you're trending upward or slipping into bad habits."
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <TrophyIcon className="w-4 h-4 text-gray-400" />
            </div>
          </CardIconTooltip>
          <h3 className="text-base font-semibold text-gray-500">
            Performance Window
          </h3>
        </div>

        <div className="relative flex-1 flex items-center min-h-0">
          <p className="text-gray-500 text-sm leading-relaxed w-[70%] pr-2">
            Start following your trading plan to build your streak
          </p>

          <div className="absolute top-1/2 -translate-y-1/2 -right-8 sm:-right-12 md:-right-16 w-32 h-32 sm:w-40 sm:h-40 md:w-40 md:h-40 overflow-visible scale-125 origin-center opacity-30">
            <div className="absolute inset-0 bg-gray-300/20 rounded-full blur-xl"></div>
            <div className="relative w-full h-full overflow-visible">
              <Image
                src="/brain-3.png"
                alt="Brain"
                fill
                className="object-contain pb-6 grayscale"
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-visible flex flex-col z-20 ${
        isHovered ? "h-auto min-h-full" : "h-full"
      }`}
      style={{
        boxShadow:
          "0 0 20px rgba(0, 191, 166, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
    >
      <motion.div layout="position" className="flex items-center gap-2 mb-3">
        <CardIconTooltip
          title="Performance Window"
          tooltipText="Evaluates your consistency over recent trades or days, tracking whether you're respecting risk limits, following setups, and maintaining composure. Helps you understand if you're trending upward or slipping into bad habits."
        >
          <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
            <TrophyIcon className="w-4 h-4 text-teal-600" />
          </div>
        </CardIconTooltip>
        <h3 className="text-base font-semibold text-primary">
          Performance Window
        </h3>
      </motion.div>

      <div className="relative flex-1 flex items-center min-h-0">
        <div className="w-[70%] z-10 transition-all">
          <motion.p 
            ref={textRef}
            layout="position"
            className={`text-gray-700 text-xs leading-relaxed pr-2 ${
              !isHovered ? "line-clamp-4" : ""
            }`}
          >
            {displayMessage}
          </motion.p>
       
        </div>

        <motion.div 
          className="absolute top-[60px] -translate-y-1/2 -right-8 sm:-right-12 md:-right-16 w-32 h-32 sm:w-40 sm:h-40 md:w-40 md:h-40 overflow-visible scale-125 origin-center"
        >
          <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-xl"></div>
          <div className="relative w-full h-full overflow-visible">
            <Image
              src="/brain-3.png"
              alt="Brain"
              fill
              className="object-contain pb-6"
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
