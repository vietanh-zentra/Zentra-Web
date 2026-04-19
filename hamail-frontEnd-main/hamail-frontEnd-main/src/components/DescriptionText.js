"use client";
import { motion } from "framer-motion";

export default function DescriptionText({
  children,
  className = "",
  delay = 0.6,
}) {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className={`text-[#18181BCC] sm:text-[24px] text-[18px] leading-[36px] font-normal ${className}`}
    >
      {children}
    </motion.p>
  );
}
