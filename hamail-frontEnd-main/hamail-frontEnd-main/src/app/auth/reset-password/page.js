"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { apiClient } from "@/utils/api";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../../../tailwind.config.js";

const fullConfig = resolveConfig(tailwindConfig);
const colors = fullConfig.theme.colors;

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Verify the token is present in the URL
    const token = searchParams.get("token");
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [searchParams]);

  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/\d/.test(password)) {
      return "Password must contain at least 1 number";
    }
    if (!/[a-zA-Z]/.test(password)) {
      return "Password must contain at least 1 letter";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match";
    }
    return null; // Valid
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate password
    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const token = searchParams.get("token");
      if (!token) {
        setError("Invalid reset link. Please request a new password reset.");
        setLoading(false);
        return;
      }

      await apiClient.resetPassword(token, password);

      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/auth/login?passwordReset=true");
      }, 2000);
    } catch (err) {
      if (err.status === 401) {
        setError(
          "This reset link has expired or is invalid. Please request a new one."
        );
      } else if (err.status === 400) {
        setError(
          "Password must be at least 8 characters and contain both letters and numbers"
        );
      } else {
        setError(
          err.message ||
            "Unable to connect. Please check your internet connection."
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

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Reset Your Password
              </h2>
              <p className="text-gray-600">Enter your new password below</p>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 font-medium mb-1">
                  Password requirements:
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• At least 8 characters</li>
                  <li>• At least 1 letter</li>
                  <li>• At least 1 number</li>
                </ul>
              </div>
            </div>

            {/* Reset Password Form */}
            <form onSubmit={handleResetPassword} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-red-600 text-sm">{error}</p>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <p className="text-green-600 text-sm">
                    Password reset successfully! Redirecting to login...
                  </p>
                </motion.div>
              )}

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 text-gray-900 pr-12"
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading || success}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-900 transition-colors duration-200"
                    disabled={loading || success}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 text-gray-900 pr-12"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading || success}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-900 transition-colors duration-200"
                    disabled={loading || success}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: loading || success ? 1 : 1.01 }}
                whileTap={{ scale: loading || success ? 1 : 0.99 }}
                disabled={loading || success}
                className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </motion.button>
            </form>

            {/* Back to login link */}
            {!success && (
              <div className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  className="text-primary hover:text-tertiary font-medium transition-colors duration-200"
                >
                  ← Back to login
                </Link>
              </div>
            )}
            {error && error.includes("expired") && (
              <div className="mt-4 text-center">
                <Link
                  href="/auth/forgot-password"
                  className="text-primary hover:text-tertiary font-medium transition-colors duration-200 text-sm"
                >
                  Request a new reset link
                </Link>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-gray-600">Loading...</div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
