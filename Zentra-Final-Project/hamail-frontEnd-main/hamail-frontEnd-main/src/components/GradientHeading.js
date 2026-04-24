// "use client";
// import { motion } from "framer-motion";

// /**
//  * Reusable gradient heading component
//  * Applies gradient text styling using Tailwind with scroll animation
//  */
// export default function GradientHeading({
//   children,
//   className = "",
//   ...props
// }) {
//   return (
//     <motion.h3
//       className={`bg-gradient-to-br from-[#000080] via-[#00bfa6] to-[#f0e8d0] bg-clip-text text-transparent mb-4 md:mb-16 pb-4 text-7xl sm:text-8xl md:text-10xl font-bold ${className}`}
//       initial={{ opacity: 0, y: 20 }}
//       whileInView={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.8, ease: "easeOut" }}
//       viewport={{ once: true }}
//       {...props}
//     >
//       {children}
//     </motion.h3>
//   );
// }
// GradientHeading.js - Fixed version
"use client";

import { motion } from "framer-motion";

export default function GradientHeading({ children, className }) {
  return (
    <motion.h3
      className={`bg-gradient-to-br from-[#000080] via-[#00bfa6] to-[#f0e8d0] bg-clip-text text-transparent mb-4 md:mb-16 pb-4 text-7xl sm:text-8xl md:text-10xl font-bold ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {children}
    </motion.h3>
  );
}