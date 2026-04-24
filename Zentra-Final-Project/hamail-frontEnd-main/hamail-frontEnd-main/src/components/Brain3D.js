"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { useMemo } from "react";
import { STATE_CONFIG } from "./StateIndicator";

/** Small helper */
const hexToRgba = (hex, a = 1) => {
  if (!hex) return `rgba(0,0,0,${a})`;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

export default function Brain3D({
  currentState = "stable",
  size = 360,
  imgSrc = "/brain.png",
}) {
  const cfg = STATE_CONFIG[currentState] || STATE_CONFIG.stable;

  /** label placement around the orb (in degrees) */
  const labels = useMemo(
    () => [
      { key: "stable", name: "Stable", angle: -22 },
      { key: "overtrading", name: "Overextended", angle: 52 },
      { key: "hesitant", name: "Hesitant", angle: 208 },
      { key: "aggressive", name: "Aggressive", angle: 135 },
    ],
    []
  );

  // geometry
  const C = size / 2;
  const brainR = size * 0.28; // visual brain radius
  const labelR = size * 0.42; // label orbital radius
  const sphereR = size * 0.46; // wireframe radius

  return (
    <div
      className="relative mx-auto grid place-items-center"
      style={{ width: size, height: size }}
    >
      {/* subtle grid background like the mockup */}
      <div
        className="absolute inset-0 rounded-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,.06), transparent 55%)",
          maskImage:
            "radial-gradient(circle at center, rgba(0,0,0,1), rgba(0,0,0,0.6))",
        }}
      />
      <div
        className="absolute inset-0 rounded-3xl"
        style={{
          backgroundSize: "36px 36px",
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,.06) 1px, transparent 1px),linear-gradient(to bottom, rgba(0,0,0,.06) 1px, transparent 1px)",
        }}
      />

      {/* wireframe sphere (dotted ellipses that very slowly rotate) */}
      <motion.svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute"
        width={size}
        height={size}
        aria-hidden
        animate={{ rotate: 360 }}
        transition={{ duration: 360, repeat: Infinity, ease: "linear" }}
      >
        {Array.from({ length: 16 }).map((_, i) => {
          // -1..1 vertical factor to fake perspective squash
          const t = (i - 7.5) / 7.5;
          const ry = sphereR * (0.35 + 0.65 * (1 - t * t));
          const stroke = hexToRgba(
            cfg.gradient.start,
            0.28 - Math.abs(t) * 0.12
          );
          return (
            <ellipse
              key={i}
              cx={C}
              cy={C}
              rx={sphereR}
              ry={ry}
              fill="none"
              stroke={stroke}
              strokeWidth={1.2}
              strokeDasharray="2.5 7.5"
            />
          );
        })}
      </motion.svg>

      {/* tiny orbital nodes like the screenshot */}
      {labels.map((l, idx) => {
        const isActive = l.key === currentState;
        const rad = (l.angle * Math.PI) / 180;
        const x = C + Math.cos(rad) * (sphereR - 10);
        const y = C + Math.sin(rad) * (sphereR - 10);
        return (
          <motion.span
            key={`node-${idx}`}
            className="absolute rounded-full"
            style={{
              left: x,
              top: y,
              width: isActive ? 10 : 8,
              height: isActive ? 10 : 8,
              translateX: "-50%",
              translateY: "-50%",
              background: isActive ? cfg.gradient.start : "rgba(0,0,0,.2)",
              boxShadow: isActive
                ? `0 0 14px ${hexToRgba(cfg.gradient.start, 0.8)}`
                : "0 0 6px rgba(0,0,0,.2)",
              opacity: isActive ? 0 : 0.4,
            }}
            animate={isActive ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2.2, repeat: Infinity, delay: idx * 0.2 }}
          />
        );
      })}

      {/* the brain itself (use your image — keeps performance high) */}
      <div
        className="relative"
        style={{
          width: brainR * 2,
          height: brainR * 2,
          filter: `drop-shadow(0 18px 40px ${hexToRgba("#1b3b7a", 0.35)})`,
        }}
      >
        <div
          className="absolute -inset-6 rounded-full blur-2xl opacity-50"
          style={{ background: hexToRgba(cfg.gradient.start, 0.25) }}
        />
        <Image
          src={imgSrc}
          alt="Brain"
          fill
          priority
          className="object-contain select-none pointer-events-none"
        />
      </div>

      {/* labels/cards with short leaders and glass look */}
      {labels.map((l, idx) => {
        const active = l.key === currentState;
        const a = (l.angle * Math.PI) / 180;
        const lx = C + Math.cos(a) * labelR;
        const ly = C + Math.sin(a) * labelR;
        const cx = C + Math.cos(a) * (brainR + 6);
        const cy = C + Math.sin(a) * (brainR + 6);

        return (
          <div key={l.key} className="absolute inset-0 pointer-events-none">
            {/* leader line + connector dot on brain edge */}
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="absolute inset-0"
              width={size}
              height={size}
              aria-hidden
            >
              <line
                x1={cx}
                y1={cy}
                x2={lx}
                y2={ly}
                stroke={"rgba(0,0,0,.08)"}
                strokeWidth={1.5}
                strokeDasharray="6 6"
                opacity={0.4}
              />
              {!active && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={"rgba(0,0,0,.12)"}
                  opacity={0.4}
                />
              )}
              {!active && (
                <circle
                  cx={lx}
                  cy={ly}
                  r={20}
                  fill={"rgba(0,0,0,.05)"}
                  opacity={0.6}
                />
              )}
            </svg>

            {/* floating card */}
            <motion.div
              className="absolute pointer-events-auto"
              style={{
                left: lx,
                top: ly,
                translateX: "-50%",
                translateY: "-50%",
              }}
              initial={{ opacity: 0, scale: 0.9, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.45, delay: idx * 0.06 }}
            >
              <div
                className={[
                  "rounded-xl border backdrop-blur-xl shadow-lg",
                  "px-4 py-2.5 whitespace-nowrap",
                  active ? "" : "opacity-50",
                ].join(" ")}
                style={{
                  background: active
                    ? `linear-gradient(180deg, ${hexToRgba(
                        cfg.gradient.start,
                        0.18
                      )}, ${hexToRgba(
                        cfg.gradient.end || cfg.gradient.start,
                        0.12
                      )})`
                    : "linear-gradient(180deg, rgba(255,255,255,.4), rgba(255,255,255,.25))",
                  borderColor: active
                    ? hexToRgba(cfg.gradient.start, 0.5)
                    : "rgba(0,0,0,.08)",
                  boxShadow: active
                    ? `0 8px 24px ${hexToRgba(cfg.gradient.start, 0.28)}`
                    : "0 4px 12px rgba(0,0,0,.04)",
                }}
              >
                <div className="flex items-center gap-3">
                  <motion.span
                    className={[
                      "inline-block rounded-full transition-all duration-300",
                      active
                        ? [
                            "w-3.5 h-3.5 ring-2 ring-offset-1 ring-teal-300/50",
                            "bg-[radial-gradient(circle,_#00bfa6_0%,_rgba(0,191,166,0.4)_70%)]",
                            "shadow-[0_0_12px_rgba(0,191,166,0.6)] animate-pulse",
                          ].join(" ")
                        : "w-3 h-3 bg-slate-300/40 opacity-45",
                    ].join(" ")}
                    animate={active ? { scale: [1, 1.25, 1] } : {}}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  />
                  <div className="relative inline-block">
                    {/* Hard light overlay */}
                    {active && (
                      <div
                        className="absolute inset-0 rounded-lg pointer-events-none"
                        style={{
                          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, transparent 50%, rgba(255, 255, 255, 0.2) 100%)`,
                          mixBlendMode: "hard-light",
                          opacity: 0.6,
                        }}
                      />
                    )}
                    <span
                      className={[
                        "font-extrabold uppercase tracking-wide px-3 py-1.5 rounded-lg",
                        "transition-all duration-300 shadow-sm relative",
                        active ? "text-sm tracking-[0.12em]" : "text-xs",
                      ].join(" ")}
                      style={{
                        color: active ? undefined : "rgba(15, 23, 42, 0.45)",
                        background: active
                          ? `linear-gradient(135deg, ${hexToRgba(
                              cfg.gradient.start,
                              0.85
                            )}, ${hexToRgba(
                              cfg.gradient.end || cfg.gradient.start,
                              0.65
                            )})`
                          : "rgba(148, 163, 184, 0.12)",
                        boxShadow: active
                          ? `inset 0 2px 8px rgba(255, 255, 255, 0.3), 0 8px 20px ${hexToRgba(
                              cfg.gradient.start,
                              0.18
                            )}`
                          : "none",
                        textShadow: active
                          ? `0 2px 8px ${hexToRgba(cfg.gradient.start, 0.4)}`
                          : "none",
                        WebkitBackgroundClip: active ? "text" : undefined,
                        WebkitTextFillColor: active ? "transparent" : undefined,
                        letterSpacing: active ? "0.12em" : "0.04em",
                      }}
                    >
                      {l.name}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
