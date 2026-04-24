"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { apiClient } from "@/utils/api";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../../../tailwind.config.js";

const fullConfig = resolveConfig(tailwindConfig);
const colors = fullConfig.theme.colors;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate email format
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      await apiClient.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      // Handle different error statuses
      if (err.status === 404) {
        // Don't reveal if email exists - show success message anyway for security
        setSuccess(true);
      } else if (err.status === 400) {
        setError("Please enter a valid email address");
      } else {
        setError(
          err.message || "Unable to connect. Please check your internet connection."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8"
          >
            <div className="mb-6">
              {/* Logo - Large centered */}
              <div className="text-center mb-12">
                <motion.h1
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
                  style={{
                    background: `linear-gradient(355deg, ${colors.secondary} 0%, ${colors.tertiary} 50%, ${colors.primary} 100%)`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  ZENTRA
                </motion.h1>
              </div>
            </div>

            {!success ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Forgot Your Password?
                  </h2>
                  <p className="text-gray-600">
                    Enter your email address and we'll send you instructions to
                    reset your password.
                  </p>
                </div>

                {/* Forgot Password Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <p className="text-red-600 text-sm">{error}</p>
                    </motion.div>
                  )}

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-900 mb-2"
                    >
                      Email address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 text-gray-900"
                      placeholder="Enter your email"
                      required
                      disabled={loading}
                    />
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: loading ? 1 : 1.01 }}
                    whileTap={{ scale: loading ? 1 : 0.99 }}
                    disabled={loading}
                    className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {loading ? "Sending..." : "Send Reset Instructions"}
                  </motion.button>
                </form>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Check Your Email
                  </h2>
                  <p className="text-gray-600">
                    If an account exists with this email, you will receive
                    password reset instructions.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Back to login link */}
            <div className="mt-6 text-center">
              <Link
                href="/auth/login"
                className="text-primary hover:text-tertiary font-medium transition-colors duration-200"
              >
                ← Back to login
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}


