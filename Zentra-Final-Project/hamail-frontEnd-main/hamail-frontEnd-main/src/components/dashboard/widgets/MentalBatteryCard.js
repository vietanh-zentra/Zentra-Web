"use client";
import { motion } from "framer-motion";
import { Battery50Icon } from "@heroicons/react/24/solid";
import CardIconTooltip from "./CardIconTooltip";
import Image from "next/image";

export default function MentalBatteryCard({
  percentage = 45,
  level = "Stable",
  message,
  hasNoTrades = false,
}) {
  const batteryLevel = Math.min(100, Math.max(0, percentage));

  const getNormalizedLevel = (l, p) => {
    const lower = l?.toLowerCase();
    if (lower === "optimal" || lower === "strong" || p >= 66) return { label: "Strong", index: 2 };
    if (lower === "strained" || lower === "low" || lower === "high risk" || lower === "high_risk" || p < 33) return { label: "Low", index: 0 };
    return { label: "Stable", index: 1 };
  };

  const { label: displayLevel, index: activeIndex } = getNormalizedLevel(level, batteryLevel);

  const statusBars = [
    { label: "Low", color: "#AAFFEF" },
    { label: "Stable", color: "#30EDCF" },
    { label: "Strong", color: "#00BFA6" },
  ];

  const CardWrapper = ({ children }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#ECF1F1] rounded-[20px] p-5 shadow-sm border border-[#FFFFFF] flex flex-col relative"
    >
      {children}
    </motion.div>
  );

  if (hasNoTrades) {
    return (
      <CardWrapper>
        <div className="flex justify-between items-center ">
          <h3 className="text-xl font-medium text-gray-700">Mental Battery</h3>
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
            <Battery50Icon className="w-5 h-5 text-gray-400" />

          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-4">
          <div className="relative w-48 h-48 opacity-20 grayscale">
            <Image
              src="/brain1.png"
              alt="Brain"
              fill
              className="object-contain"
            />
          </div>
          <div className="mt-6 text-center">
            <div className="text-4xl font-bold text-gray-400">--%</div>
            <p className="text-sm text-gray-500 mt-2">
              No data available for this date
            </p>
          </div>
        </div>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper>
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-medium text-[#363636]">Mental Battery</h3>
        <CardIconTooltip
          title="Mental Battery"
          tooltipText="Estimates your current mental energy based on recent activity. Helps you understand when you're operating at your sharpest."
          position="bottom"
        >
          <div className="w-10 h-10 rounded-full bg-[#F2F7F7] border border-[#FFFFFF] flex items-center justify-center shadow-sm cursor-help">
            {/* <Battery50Icon className="w-5 h-5 text-gray-600" /> */}
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
              className="lucide lucide-battery-full-icon lucide-battery-full text-[#363636]"
            >
              <path d="M10 10v4" />
              <path d="M14 10v4" />
              <path d="M22 14v-4" />
              <path d="M6 10v4" />
              <rect x="2" y="6" width="16" height="12" rx="2" />
            </svg>

          </div>
        </CardIconTooltip>
      </div>

      {/* Brain Image */}
      <div className="flex-1 flex items-center justify-center relative p-[20px]">
        <motion.div
          className="relative w-[211px] h-[212px]"
          animate={{ rotate: [0, 18, -18, 0] }}
          transition={{
            duration: 8,        // slow premium motion
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {/* Subtle glow behind brain */}
          <div className="absolute inset-0 bg-teal-200/20 rounded-full blur-3xl" />

          <Image
            src="/brain1.png"
            alt="Brain Visualization"
            fill
            className="object-contain"
            priority
          />
        </motion.div>
      </div>

      {/* Percentage & Status Badge */}
      <div className="flex items-center  mb-4">
        <span className="text-[32px] font-semibold text-gray-800 tracking-tight">{batteryLevel}%</span>
        <div className="flex items-center gap-2 px-4 py-1.5 bg-white/60 backdrop-blur-sm rounded-full border border-white/60 text-sm font-semibold text-gray-600 shadow-sm">
          <span className={`w-2.5 h-2.5 rounded-full ${activeIndex === 0 ? "bg-[#B2FFF0]" : activeIndex === 1 ? "bg-[#37E3C0]" : "bg-[#00BFA6]"
            }`} />
          {displayLevel}
        </div>
      </div>

      {/* Status Bars */}
      <div className="grid grid-cols-3 ">
        {statusBars.map((bar, index) => (
          <div key={bar.label} className="flex flex-col items-center gap-2">
            <div
              className="w-full h-11  rounded-2xl transition-all duration-500"
              style={{
                backgroundColor: bar.color,
                opacity: index <= activeIndex ? 1 : 0.2,
                boxShadow: index === activeIndex ? `0 4px 12px ${bar.color}40` : 'none',
              }}
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