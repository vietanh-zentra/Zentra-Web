"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { SparklesIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import CardIconTooltip from "./CardIconTooltip";

export default function ZentraBreathwork({ shouldSuggest, message }) {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState("Ready"); // Ready, Inhale, Hold, Exhale

  // Cycle Configuration: 4s Inhale, 4s Hold, 4s Exhale = 12s Cycle
  // 20s Total Session (Quick Reset)
  const CYCLE_DURATION = 12000;
  const INHALE_DURATION = 4000;
  const HOLD_DURATION = 4000;
  const EXHALE_DURATION = 4000;
  const TOTAL_SESSION_TIME = 20000;

  const handleStart = () => {
    setIsActive(true);
    setPhase("Inhale");
  };

  const handleStop = () => {
    setIsActive(false);
    setPhase("Ready");
  };

  useEffect(() => {
    let timeouts = [];
    let intervalId = null;

    if (isActive) {
      const runCycle = () => {
        setPhase("Inhale");

        const t1 = setTimeout(() => {
          setPhase("Hold");
        }, INHALE_DURATION);
        timeouts.push(t1);

        const t2 = setTimeout(() => {
          setPhase("Exhale");
        }, INHALE_DURATION + HOLD_DURATION);
        timeouts.push(t2);
      };

      // Run immediate first cycle
      runCycle();

      // Set interval for subsequent cycles
      intervalId = setInterval(runCycle, CYCLE_DURATION);

      // Auto-stop after 20 seconds
      const stopTimeout = setTimeout(() => {
        setIsActive(false);
        setPhase("Ready");
        clearInterval(intervalId);
      }, TOTAL_SESSION_TIME + 500); // Small buffer
      timeouts.push(stopTimeout);
    } else {
      setPhase("Ready");
    }

    return () => {
      timeouts.forEach(clearTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isActive]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="relative overflow shadow-lg flex flex-col"
      style={{
        height: "201px",
        borderRadius: "20px",
        background: "linear-gradient(to right, #244896, #55C3C8)",
        boxShadow: "0 10px 30px -10px rgba(37, 99, 235, 0.3)",
        opacity: 1,
        transform: "rotate(0deg)",
      }}
    >
      <div className="relative w-full h-full p-10 flex flex-col justify-center z-10">
        <div className="w-[60%] z-20">
          <h3 className="text-[24px] font-semibold text-white mb-2 leading-tight">
            Zentra Breathwork
          </h3>
          
          <div className="min-h-[3rem]  flex items-center">
            <AnimatePresence mode="wait">
              {!isActive ? (
                <motion.p 
                  key="idle-text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] text-white/90 leading-relaxed font-light"
                >
                </motion.p>
              ) : (
                <motion.p 
                  key="active-text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-lg font-medium text-white/90 leading-relaxed"
                >
                  {phase === "Ready" ? "Get Ready..." : 
                   phase === "Inhale" ? "INHALE..." : 
                   phase === "Hold" ? "HOLD..." : "EXHALE..."}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={isActive ? handleStop : handleStart}
            className={`group flex items-center gap-2 px-5 py-3 rounded-full border transition-all bg-white/10 border-white/40 text-white hover:bg-white/20 text-sm font-medium`}
          >
            {isActive ? "Stop Session" : "Start 20s Quick Reset"}
            {!isActive && <ChevronRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />}
          </button>
        </div>
        
        {/* 3D Illustration */}
        <div 
          className="absolute pointer-events-none z-10"
          style={{
            width: "300px",
            height: "287px",
            top: "-101px",
            right: "40px",
            transform: "rotate(0deg)",
            opacity: 1
          }}
        >
           <motion.img 
             src="/breathImg.png" 
             alt="Meditation" 
             className="w-full h-full object-contain drop-shadow-2xl"
             animate={{
               scale:
                 phase === "Inhale"
                   ? 1.08
                   : phase === "Exhale"
                   ? 0.96
                   : 1,
               y:
                 phase === "Inhale"
                   ? -6
                   : phase === "Exhale"
                   ? 12
                   : 0,
               filter: isActive && phase === "Hold" ? "brightness(1.1)" : "brightness(1)"
             }}
             transition={{
               duration:
                 phase === "Inhale"
                   ? 4
                   : phase === "Exhale"
                   ? 4
                   : 0.8,
               ease: "easeInOut"
             }}
           />
        </div>
      </div>
    </motion.div>
  );
}