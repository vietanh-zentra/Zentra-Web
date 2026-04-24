"use client";

import { motion } from "framer-motion";

export default function GlassmorphicButton({
  children,
  onClick,
  disabled = false,
  className = "",
  icon,
  iconPosition = "left",
  whileHover = { scale: 1.02 },
  whileTap = { scale: 0.98 },
  ...props
}) {
  const baseStyles = {
    background:
      "linear-gradient(135deg, rgba(0, 191, 166, 0.15) 0%, rgba(0, 0, 128, 0.12) 50%, rgba(0, 191, 166, 0.1) 100%)",
    border: "1px solid transparent",
    boxShadow:
      "0 4px 6px -1px rgba(0, 191, 166, 0.15), 0 2px 4px -1px rgba(0, 0, 128, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 0 rgba(0, 191, 166, 0.1)",
  };

  const hoverStyles = {
    background:
      "linear-gradient(135deg, rgba(0, 191, 166, 0.18) 0%, rgba(0, 0, 128, 0.15) 50%, rgba(0, 191, 166, 0.13) 100%)",
    border: "1px solid transparent",
    boxShadow:
      "0 4px 6px -1px rgba(0, 191, 166, 0.18), 0 2px 4px -1px rgba(0, 0, 128, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.18), inset 0 -1px 0 0 rgba(0, 191, 166, 0.12)",
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : whileHover}
      whileTap={disabled ? {} : whileTap}
      className={`text-primary rounded-lg font-medium transition-all duration-300 backdrop-blur-md flex items-center gap-2 ${className} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      style={baseStyles}
      onMouseEnter={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, hoverStyles);
        }
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, baseStyles);
      }}
      {...props}
    >
      {icon && iconPosition === "left" && icon}
      {children}
      {icon && iconPosition === "right" && icon}
    </motion.button>
  );
}

