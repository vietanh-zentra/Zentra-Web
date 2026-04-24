"use client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

export default function Toast({ show, message, type = "success", onClose }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 right-4 z-50 max-w-md"
        >
          <div
            className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md ${
              type === "success"
                ? "bg-gradient-to-r from-primary to-blue-600 text-white border border-primary/30"
                : "bg-gradient-to-r from-red-600 to-red-500 text-white border border-red-500/30"
            }`}
          >
            {type === "success" ? (
              <CheckCircleIcon className="w-6 h-6 flex-shrink-0" />
            ) : (
              <XCircleIcon className="w-6 h-6 flex-shrink-0" />
            )}
            <h6 className="text-white">{message}</h6>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
