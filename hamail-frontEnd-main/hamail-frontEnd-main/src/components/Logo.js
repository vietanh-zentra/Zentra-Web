"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../tailwind.config.js";

const fullConfig = resolveConfig(tailwindConfig);
const colors = fullConfig.theme.colors;

export default function Logo({ isScrolled, onClick, className }) {
  return (
    <Link onClick={onClick} href="/" className="flex items-center">
      <motion.h1
        className={
          className ||
          "text-xl sm:text-2xl font-bold tracking-tight leading-none"
        }
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
        style={{
          background:
            "linear-gradient(to right, #c4e8d8 0%, #20b2aa 50%, #1e3a8a 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
          display: "inline-block",
        }}
      >
        ZENTRA
      </motion.h1>
    </Link>
  );
}
