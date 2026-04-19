"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function BrainAnimation() {
  const [currentState, setCurrentState] = useState("focused");
  const states = ["focused", "overtrading", "hesitant", "aggressive", "stable"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentState((prev) => {
        const currentIndex = states.indexOf(prev);
        return states[(currentIndex + 1) % states.length];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getStateColor = (state) => {
    const colors = {
      focused: "from-primary to-tertiary",
      overtrading: "from-primary to-primary",
      hesitant: "from-primary to-primary",
      aggressive: "from-primary to-primary",
      stable: "from-primary to-primary",
    };
    return colors[state] || colors.focused;
  };

  // Centralized theme map for state-driven visuals (SVG, blobs, dots, feature card)
  const getStateTheme = (state) => {
    switch (state) {
      case "focused":
        return {
          gradientTW: "from-primary to-tertiary",
          colors: ["#000080", "#00bfa6", "#000080"],
          node: "#00bfa6",
          line: "rgba(0,191,166,0.7)",
          dot: "#00bfa6",
          feature: {
            title: "Calm, Focused Mind",
            desc: "Your prefrontal cortex is in control. Neural pathways are clear and decision-making is optimal. Keep this mental state flowing.",
          },
        };
      case "overtrading":
        return {
          gradientTW: "from-red-600 to-red-700",
          colors: ["#dc2626", "#ef4444", "#b91c1c"],
          node: "#dc2626",
          line: "rgba(220,38,38,0.8)",
          dot: "#dc2626",
          feature: {
            title: "Overstimulated Brain",
            desc: "Your amygdala is firing too much. Neural overload detected. Take a 5-minute break to reset your cognitive circuits.",
          },
        };
      case "hesitant":
        return {
          gradientTW: "from-purple-600 to-purple-700",
          colors: ["#8b5cf6", "#a78bfa", "#7c3aed"],
          node: "#8b5cf6",
          line: "rgba(139,92,246,0.8)",
          dot: "#8b5cf6",
          feature: {
            title: "Hesitant Neural Network",
            desc: "Your brain is second-guessing. Trust your trained neural pathways. If criteria are met, execute with confidence.",
          },
        };
      case "aggressive":
        return {
          gradientTW: "from-orange-600 to-orange-700",
          colors: ["#f97316", "#fb923c", "#ea580c"],
          node: "#f97316",
          line: "rgba(249,115,22,0.8)",
          dot: "#f97316",
          feature: {
            title: "Aggressive Brain State",
            desc: "Your limbic system is taking over. Tighten your cognitive controls. Only proceed if your prefrontal cortex confirms the edge.",
          },
        };
      case "stable":
        return {
          gradientTW: "from-primary to-tertiary",
          colors: ["#000080", "#00bfa6", "#000080"],
          node: "#00bfa6",
          line: "rgba(0,191,166,0.7)",
          dot: "#00bfa6",
          feature: {
            title: "Balanced Neural Harmony",
            desc: "Your brain hemispheres are perfectly synchronized. Neural pathways are stable and consistent. Maintain this cognitive equilibrium.",
          },
        };
      default:
        return {
          gradientTW: "from-primary to-tertiary",
          colors: ["#000080", "#00bfa6", "#000080"],
          node: "#00bfa6",
          line: "rgba(0,191,166,0.7)",
          dot: "#00bfa6",
          feature: {
            title: "Calm, Focused Mind",
            desc: "Your prefrontal cortex is in control. Neural pathways are clear and decision-making is optimal. Keep this mental state flowing.",
          },
        };
    }
  };

  const theme = getStateTheme(currentState);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="relative flex justify-center lg:justify-end"
    >
      <div className="relative w-96 h-96 lg:w-[520px] lg:h-[520px]">
        {/* Glassmorphic container */}
        <div className="absolute inset-0 bg-secondary/20 backdrop-blur-md rounded-3xl border border-primary/30 shadow-2xl" />

        {/* Brain visualization */}
        <div className="relative w-full h-full flex items-center justify-center">
          <motion.div
            className="relative w-80 h-80 lg:w-[420px] lg:h-[420px]"
            animate={{
              rotateY: [0, 5, -5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Brain outline - dual hemisphere */}
            <svg
              viewBox="0 0 400 400"
              className="w-full h-full"
              style={{
                filter: `drop-shadow(0 0 20px ${theme.colors[0]}40)`,
              }}
            >
              {/* Left hemisphere with straight inner edge */}
              <motion.path
                id="leftHemisphere"
                d="M188 92
                   C 158 78, 118 88, 102 118
                   C 88 142, 90 170, 104 190
                   C 86 210, 90 240, 115 258
                   C 100 276, 112 302, 142 312
                   C 164 319, 182 316, 190 308
                   L 190 92 Z"
                fill="url(#brainGradient)"
                stroke="rgba(0,0,128,0.5)"
                strokeWidth="2"
              />
              {/* Right hemisphere with straight inner edge */}
              <motion.path
                id="rightHemisphere"
                d="M212 92
                   C 242 78, 282 88, 298 118
                   C 312 142, 310 170, 296 190
                   C 314 210, 310 240, 285 258
                   C 300 276, 288 302, 258 312
                   C 236 319, 218 316, 210 308
                   L 210 92 Z"
                fill="url(#brainGradient)"
                stroke="rgba(0,0,128,0.5)"
                strokeWidth="2"
              />

              {/* Corpus callosum highlight (subtle) */}
              <motion.line
                x1="200"
                y1="110"
                x2="200"
                y2="295"
                stroke="rgba(0,0,128,0.35)"
                strokeDasharray="4 6"
              />

              {/* Neural network lines */}
              {[...Array(12)].map((_, i) => (
                <motion.line
                  key={i}
                  x1={200 + Math.cos((i * 30 * Math.PI) / 180) * 60}
                  y1={200 + Math.sin((i * 30 * Math.PI) / 180) * 60}
                  x2={200 + Math.cos((i * 30 * Math.PI) / 180) * 95}
                  y2={200 + Math.sin((i * 30 * Math.PI) / 180) * 95}
                  stroke={theme.line}
                  strokeWidth="2"
                  className="drop-shadow-sm"
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    strokeWidth: [1, 3, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}

              {/* Neural nodes */}
              {[...Array(14)].map((_, i) => (
                <motion.circle
                  key={i}
                  cx={
                    200 +
                    Math.cos((i * 25 * Math.PI) / 180) * (i % 2 === 0 ? 80 : 60)
                  }
                  cy={
                    200 +
                    Math.sin((i * 25 * Math.PI) / 180) * (i % 2 === 0 ? 70 : 50)
                  }
                  r="5"
                  fill={theme.node}
                  className="drop-shadow-lg"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}

              {/* Sulci (grooves) clipped per hemisphere */}
              <defs>
                <clipPath id="clipLeft">
                  <use href="#leftHemisphere" />
                </clipPath>
                <clipPath id="clipRight">
                  <use href="#rightHemisphere" />
                </clipPath>
                <linearGradient
                  id="sulciGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor={theme.colors[0]}
                    stopOpacity="0.7"
                  />
                  <stop
                    offset="100%"
                    stopColor={theme.colors[2]}
                    stopOpacity="0.5"
                  />
                </linearGradient>
              </defs>
              <g clipPath="url(#clipLeft)">
                {[...Array(5)].map((_, i) => (
                  <motion.path
                    key={`ls-${i}`}
                    d={`M ${150 - i * 6} ${130 + i * 18} C ${135 - i * 8} ${
                      145 + i * 16
                    }, ${155 - i * 2} ${175 + i * 14}, 175 ${185 + i * 10}`}
                    fill="none"
                    stroke="url(#sulciGrad)"
                    strokeOpacity="0.6"
                    strokeWidth="1.5"
                    animate={{ opacity: [0.35, 0.75, 0.35] }}
                    transition={{
                      duration: 2.4 + i * 0.2,
                      repeat: Infinity,
                    }}
                  />
                ))}
              </g>
              <g clipPath="url(#clipRight)">
                {[...Array(5)].map((_, i) => (
                  <motion.path
                    key={`rs-${i}`}
                    d={`M ${250 + i * 6} ${130 + i * 18} C ${265 + i * 8} ${
                      145 + i * 16
                    }, ${245 + i * 2} ${175 + i * 14}, 225 ${185 + i * 10}`}
                    fill="none"
                    stroke="url(#sulciGrad)"
                    strokeOpacity="0.6"
                    strokeWidth="1.5"
                    animate={{ opacity: [0.35, 0.75, 0.35] }}
                    transition={{
                      duration: 2.4 + i * 0.2,
                      repeat: Infinity,
                    }}
                  />
                ))}
              </g>

              {/* Gloss highlights */}
              <ellipse
                cx="170"
                cy="120"
                rx="22"
                ry="10"
                fill="#f0e8d0"
                opacity="0.15"
              />
              <ellipse
                cx="230"
                cy="120"
                rx="22"
                ry="10"
                fill="#f0e8d0"
                opacity="0.12"
              />

              {/* Gradient definition */}
              <defs>
                <linearGradient
                  id="brainGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor={theme.colors[0]}
                    stopOpacity="0.85"
                  />
                  <stop
                    offset="50%"
                    stopColor={theme.colors[1]}
                    stopOpacity="0.6"
                  />
                  <stop
                    offset="100%"
                    stopColor={theme.colors[2]}
                    stopOpacity="0.85"
                  />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        </div>

        {/* State indicator */}
        <motion.div
          key={currentState}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-4 right-4 px-4 py-2 bg-secondary/90 backdrop-blur-sm rounded-full border border-primary/30 shadow-lg"
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full bg-gradient-to-r ${getStateColor(
                currentState
              )} animate-pulse`}
            />
            <span className="text-sm font-medium text-primary capitalize">
              {currentState}
            </span>
          </div>
        </motion.div>

        {/* Floating data points */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`${currentState}-${i}`}
            className="absolute w-2 h-2 rounded-full opacity-60"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
              backgroundColor: theme.dot,
            }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.3, 0.8, 0.3],
              backgroundColor: [
                theme.dot,
                theme.colors[(i + 1) % theme.colors.length],
                theme.dot,
              ],
            }}
            transition={{
              duration: 2 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
