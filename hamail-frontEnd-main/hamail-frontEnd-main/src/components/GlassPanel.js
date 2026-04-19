"use client";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

export default function GlassPanel({
  children,
  className = "",
  variant = "default",
  padding = "default",
  hover = false,
  ...props
}) {
  const baseClasses =
    "relative rounded-2xl border border-primary/15 bg-secondary/10 backdrop-blur-xl shadow-[0_10px_30px_-10px_rgba(0,0,128,0.35)]";

  const variants = {
    default: "bg-secondary/10 border-primary/15",
    light: "bg-secondary/20 border-primary/25",
    dark: "bg-primary/20 border-secondary/10",
    primary: "bg-primary/10 border-primary/20",
    secondary: "bg-secondary/10 border-secondary/20",
  };

  const paddingVariants = {
    none: "",
    sm: "p-4",
    default: "p-6 md:p-8",
    lg: "p-8 md:p-10",
    xl: "p-10 md:p-12",
  };

  const hoverClasses = hover
    ? "hover:bg-secondary/15 hover:border-primary/25 hover:shadow-[0_15px_40px_-10px_rgba(0,0,128,0.4)] transition-all duration-300"
    : "";

  return (
    <motion.div
      className={cn(
        baseClasses,
        variants[variant],
        paddingVariants[padding],
        hoverClasses,
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      {...props}
    >
      {/* Inner highlight */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-secondary/8 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
