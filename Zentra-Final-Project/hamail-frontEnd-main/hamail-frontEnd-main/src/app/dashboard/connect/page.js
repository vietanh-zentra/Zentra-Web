"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LinkIcon,
  ArrowPathIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { apiClient } from "@/utils/api";
import { notifyTradesUpdated } from "@/app/hooks/useTrades";
import LoadingSpinner from "@/components/LoadingSpinner";
import Toast from "@/components/Toast";
import GlassmorphicButton from "@/components/GlassmorphicButton";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../../../tailwind.config.js";

const fullConfig = resolveConfig(tailwindConfig);
const colors = fullConfig.theme.colors;

export default function ConnectPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [mt5Status, setMt5Status] = useState(null);
  const [formData, setFormData] = useState({
    accountId: "",
    server: "",
    password: "",
  });

  // Load MT5 status on mount
  useEffect(() => {
    loadMT5Status();
  }, []);

  const loadMT5Status = async () => {
    setIsLoading(true);
    try {
      const status = await apiClient.getMT5Status();
      setMt5Status(status);
      setShowConnectForm(!status.connected);
    } catch (error) {
      console.error("Error loading MT5 status:", error);
      setToast({
        show: true,
        message: "Failed to load MT5 connection status.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleConnect = async () => {
    // Validation
    if (!formData.accountId.trim()) {
      setToast({
        show: true,
        message: "Please enter your MT5 account ID.",
        type: "error",
      });
      return;
    }

    if (!formData.server.trim()) {
      setToast({
        show: true,
        message: "Please enter your MT5 server name.",
        type: "error",
      });
      return;
    }

    if (!formData.password.trim()) {
      setToast({
        show: true,
        message: "Please enter your MT5 password.",
        type: "error",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const result = await apiClient.connectMT5(
        formData.accountId,
        formData.server,
        formData.password
      );

      setToast({
        show: true,
        message: "Successfully connected to MT5 account!",
        type: "success",
      });

      // Reload status
      await loadMT5Status();

      // Clear form
      setFormData({
        accountId: "",
        server: "",
        password: "",
      });
    } catch (error) {
      console.error("Error connecting to MT5:", error);
      setToast({
        show: true,
        message:
          error.message ||
          "Failed to connect to MT5 account. Please check your credentials.",
        type: "error",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await apiClient.syncMT5Trades();
      await notifyTradesUpdated();

      setToast({
        show: true,
        message: `Successfully synced ${result.count || 0} trades from MT5!`,
        type: "success",
      });

      // Reload status to get updated lastSyncAt
      await loadMT5Status();
    } catch (error) {
      console.error("Error syncing MT5 trades:", error);
      setToast({
        show: true,
        message: error.message || "Failed to sync trades from MT5.",
        type: "error",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your MT5 account?")) {
      return;
    }

    setIsDisconnecting(true);
    try {
      await apiClient.disconnectMT5();

      setToast({
        show: true,
        message: "Successfully disconnected MT5 account.",
        type: "success",
      });

      // Reload status
      await loadMT5Status();
    } catch (error) {
      console.error("Error disconnecting MT5:", error);
      setToast({
        show: true,
        message: error.message || "Failed to disconnect MT5 account.",
        type: "error",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-primary px-6 text-center">
        <LoadingSpinner className="w-16 h-16" />
        <p className="text-base sm:text-lg font-medium max-w-md">
          Connecting to your MT5 account. This can take a little time—feel free
          to come back in a bit while we finish setting things up.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: "", type: "success" })}
      />

      <div className="max-w-5xl mx-auto mt-[108px]">
        {/* Header */}
        <div className="mb-8">
          <motion.h3
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-2xl font-bold mb-4"
            style={{
              background: `linear-gradient(355deg, ${colors.secondary} 0%, ${colors.tertiary} 50%, ${colors.primary} 100%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
            }}
          >
          
          </motion.h3>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Connect MT5</h1>
          <p className="text-gray-600 text-lg">
            Connect your MetaTrader 5 account to automatically sync trades
          </p>
        </div>

        {/* Connection Status Card */}
        {mt5Status && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 p-6 rounded-none backdrop-blur-xl transition-all duration-300 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow:
                "0 8px 32px 0 rgba(0, 0, 128, 0.15), 0 0 0 1px rgba(255,255,255,0.1) inset",
            }}
          >
            <div className="absolute inset-0 rounded-none bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {mt5Status.connected ? (
                      <CheckCircleIcon className="w-8 h-8 text-green-600" />
                    ) : (
                      <ExclamationCircleIcon className="w-8 h-8 text-gray-400" />
                    )}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Connection Status
                      </h3>
                      <p
                        className={`text-sm ${
                          mt5Status.connected
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        {mt5Status.connected
                          ? "Connected"
                          : mt5Status.message || "Not Connected"}
                      </p>
                    </div>
                  </div>
                </div>
                {!mt5Status.connected && (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    <span>
                      Connection requests can take a few minutes. You can safely
                      leave this page and we’ll finish the setup in the
                      background.
                    </span>
                  </div>
                )}
              </div>

              {mt5Status.connected && (
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-600">Account ID</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {mt5Status.accountId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Server</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {mt5Status.server}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Sync</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(mt5Status.lastSyncAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Connect Form */}
        {showConnectForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 p-6 rounded-none backdrop-blur-xl transition-all duration-300 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow:
                "0 8px 32px 0 rgba(0, 0, 128, 0.15), 0 0 0 1px rgba(255,255,255,0.1) inset",
            }}
          >
            <div className="absolute inset-0 rounded-none bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Connect MT5 Account
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account ID
                  </label>
                  <input
                    type="text"
                    value={formData.accountId}
                    onChange={(e) =>
                      handleInputChange("accountId", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="e.g., 12345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Server
                  </label>
                  <input
                    type="text"
                    value={formData.server}
                    onChange={(e) =>
                      handleInputChange("server", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="e.g., Broker-Demo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Enter your MT5 password"
                  />
                </div>
                <GlassmorphicButton
                  onClick={handleConnect}
                  disabled={isConnecting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-3"
                  icon={
                    isConnecting ? (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <LinkIcon className="w-5 h-5" />
                    )
                  }
                >
                  {isConnecting ? "Connecting..." : "Connect MT5"}
                </GlassmorphicButton>
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        {mt5Status?.connected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid md:grid-cols-2 gap-4"
          >
            {/* Sync Trades Button */}
            <motion.div
              className="p-6 rounded-none backdrop-blur-xl transition-all duration-300 relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                boxShadow:
                  "0 8px 32px 0 rgba(0, 0, 128, 0.15), 0 0 0 1px rgba(255,255,255,0.1) inset",
              }}
            >
              <div className="absolute inset-0 rounded-none bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Sync Trades
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Import your latest trades from MT5. If no date is specified,
                  it will sync from your last sync time or 30 days ago.
                </p>
                <GlassmorphicButton
                  onClick={handleSync}
                  disabled={isSyncing}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-3"
                  icon={
                    isSyncing ? (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowPathIcon className="w-5 h-5" />
                    )
                  }
                >
                  {isSyncing ? "Syncing..." : "Sync Trades"}
                </GlassmorphicButton>
              </div>
            </motion.div>

            {/* Disconnect Button */}
            <motion.div
              className="p-6 rounded-none backdrop-blur-xl transition-all duration-300 relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                boxShadow:
                  "0 8px 32px 0 rgba(0, 0, 128, 0.15), 0 0 0 1px rgba(255,255,255,0.1) inset",
              }}
            >
              <div className="absolute inset-0 rounded-none bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Disconnect
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Remove your MT5 account connection. You can reconnect anytime.
                </p>
                <motion.button
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDisconnecting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <XMarkIcon className="w-5 h-5" />
                      Disconnect MT5
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </>
  );
}
