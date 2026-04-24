"use client";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

export default function GlassButton({
  children,
  className = "",
  variant = "glass",
  size = "default",
  disabled = false,
  onClick,
  type = "button",
  ...props
}) {
  const baseClasses =
    "relative inline-flex items-center justify-center font-medium rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    glass:
      "bg-secondary/15 hover:bg-secondary/25 border-primary/20 text-primary focus:ring-primary/50 backdrop-blur-md",
    solid:
      "bg-primary hover:bg-primary/90 border-primary text-secondary focus:ring-primary/50",
    solidSecondary:
      "bg-secondary hover:bg-secondary/90 border-secondary text-primary focus:ring-secondary/50",
    outline:
      "bg-transparent hover:bg-secondary/10 border-primary/30 text-primary hover:text-primary/80 focus:ring-primary/50",
    ghost:
      "bg-transparent hover:bg-secondary/10 border-transparent text-primary hover:text-primary/80 focus:ring-primary/50",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    default: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
    xl: "px-10 py-5 text-xl",
  };

  return (
    <motion.button
      type={type}
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      disabled={disabled}
      onClick={onClick}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {/* Inner highlight for glass variant */}
      {variant === "glass" && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-secondary/10 to-transparent pointer-events-none" />
      )}

      {/* Content */}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
