"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ChartBarIcon,
  ClockIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { apiClient } from "@/utils/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import Toast from "@/components/Toast";
import GlassmorphicButton from "@/components/GlassmorphicButton";
import OnboardingModal from "@/components/OnboardingModal";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../../../tailwind.config.js";
import { useTradingPlan } from "@/context/TradingPlanContext";

const fullConfig = resolveConfig(tailwindConfig);
const colors = fullConfig.theme.colors;

export default function TradingPlanPage() {
  const router = useRouter();
  const tradingPlanContext = useTradingPlan();
  const refreshTradingPlanStatus = tradingPlanContext?.refreshStatus;
  const setHasTradingPlan = tradingPlanContext?.setHasTradingPlan;
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [planData, setPlanData] = useState({
    maxTradesPerDay: "",
    riskPercentPerTrade: "",
    targetRiskRewardRatio: "1.5",
    customRiskReward: "",
    preferredSessions: [],
    stopLossDiscipline: "ALWAYS",
  });
  const [originalData, setOriginalData] = useState(null);

  // Load trading plan on mount
  useEffect(() => {
    loadTradingPlan();
  }, []);

  const loadTradingPlan = async () => {
    setIsLoading(true);
    try {
      const plan = await apiClient.getTradingPlan();
      if (plan) {
        // Check if risk reward is a standard value or custom
        const standardValues = ["1", "1.5", "2", "3"];
        const riskReward = plan.targetRiskRewardRatio.toString();
        const isCustom = !standardValues.includes(riskReward);

        const formattedData = {
          maxTradesPerDay: plan.maxTradesPerDay.toString(),
          riskPercentPerTrade: plan.riskPercentPerTrade.toString(),
          targetRiskRewardRatio: isCustom ? "custom" : riskReward,
          customRiskReward: isCustom ? riskReward : "",
          preferredSessions: plan.preferredSessions || [],
          stopLossDiscipline: plan.stopLossDiscipline || "ALWAYS",
        };

        setPlanData(formattedData);
        setOriginalData(formattedData);
      } else {
        // No plan exists, show onboarding modal
        setShowOnboarding(true);
      }
    } catch (error) {
      // If error is 403 or 404, no plan exists - show modal (don't show error toast)
      if (error.status === 403 || error.status === 404) {
        setShowOnboarding(true);
      } else {
        console.error("Error loading trading plan:", error);
        setToast({
          show: true,
          message: "Failed to load trading plan. Please try again.",
          type: "error",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setPlanData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSessionToggle = (session) => {
    setPlanData((prev) => ({
      ...prev,
      preferredSessions: prev.preferredSessions.includes(session)
        ? prev.preferredSessions.filter((s) => s !== session)
        : [...prev.preferredSessions, session],
    }));
  };

  const handleSave = async () => {
    // Validation
    if (!planData.maxTradesPerDay || Number(planData.maxTradesPerDay) <= 0) {
      setToast({
        show: true,
        message: "Please enter a valid maximum trades per day.",
        type: "error",
      });
      return;
    }

    if (
      !planData.riskPercentPerTrade ||
      Number(planData.riskPercentPerTrade) <= 0
    ) {
      setToast({
        show: true,
        message: "Please enter a valid risk percentage per trade.",
        type: "error",
      });
      return;
    }

    if (Number(planData.riskPercentPerTrade) > 100) {
      setToast({
        show: true,
        message: "Risk percentage per trade must be 100% or less.",
        type: "error",
      });
      return;
    }

    const riskReward =
      planData.targetRiskRewardRatio === "custom"
        ? planData.customRiskReward
        : planData.targetRiskRewardRatio;

    if (!riskReward || Number(riskReward) <= 0) {
      setToast({
        show: true,
        message: "Please enter a valid risk-reward ratio.",
        type: "error",
      });
      return;
    }

    if (planData.preferredSessions.length === 0) {
      setToast({
        show: true,
        message: "Please select at least one trading session.",
        type: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.createOrUpdateTradingPlan({
        maxTradesPerDay: Number(planData.maxTradesPerDay),
        riskPercentPerTrade: Number(planData.riskPercentPerTrade),
        targetRiskRewardRatio: Number(riskReward),
        preferredSessions: planData.preferredSessions,
        stopLossDiscipline: planData.stopLossDiscipline,
      });

      setOriginalData({ ...planData });
      setIsEditing(false);
      setToast({
        show: true,
        message: "Trading plan updated successfully!",
        type: "success",
      });

      // Auto-hide toast after 3 seconds
      setTimeout(() => {
        setToast({ show: false, message: "", type: "success" });
      }, 3000);
    } catch (error) {
      console.error("Error saving trading plan:", error);
      setToast({
        show: true,
        message: "Failed to save trading plan. Please try again.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalData) {
      setPlanData({ ...originalData });
    }
    setIsEditing(false);
  };

  const handleOnboardingComplete = async (isFirstTime = false) => {
    setShowOnboarding(false);

    // Reload the trading plan data
    await loadTradingPlan();

    if (typeof refreshTradingPlanStatus === "function") {
      await refreshTradingPlanStatus();
    }

    // Show success toast
    setToast({
      show: true,
      message: isFirstTime
        ? "🎉 Trading plan created successfully!"
        : "Preferences updated successfully!",
      type: "success",
    });

    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);

    // Redirect to dashboard after a short delay
    if (isFirstTime) {
      if (typeof setHasTradingPlan === "function") {
        setHasTradingPlan(true);
      }
      router.replace("/dashboard");
      router.refresh();
    } else {
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    }
  };

  const getRiskRewardDisplay = () => {
    if (planData.targetRiskRewardRatio === "custom") {
      return `1:${planData.customRiskReward || "N/A"}`;
    }
    return `1:${planData.targetRiskRewardRatio}`;
  };

  const getSessionLabel = (session) => {
    const labels = {
      LONDON: "London Session",
      NY: "New York Session",
      ASIA: "Asia Session",
    };
    return labels[session] || session;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="w-16 h-16" />
      </div>
    );
  }

  return (
    <>
      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: "", type: "success" })}
      />

      <div className="max-w-5xl mx-auto mt-[108px] ">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
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
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Trading Plan
              </h1>
              <p className="text-gray-600 text-lg">
                Manage your trading preferences and risk parameters
              </p>
            </div>

            {!isEditing && (
              <GlassmorphicButton
                onClick={() => setIsEditing(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3"
                icon={<PencilIcon className="w-5 h-5" />}
              >
                Edit Plan
              </GlassmorphicButton>
            )}

            {isEditing && (
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={handleCancel}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-300"
                >
                  <XMarkIcon className="w-5 h-5" />
                  Cancel
                </motion.button>
                <GlassmorphicButton
                  onClick={handleSave}
                  disabled={isSaving}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3"
                  icon={
                    isSaving ? (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckIcon className="w-5 h-5" />
                    )
                  }
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </GlassmorphicButton>
              </div>
            )}
          </div>
        </div>

        {/* Trading Plan Summary */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Max Trades Per Day */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-6 rounded-none backdrop-blur-xl transition-all duration-300 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow:
                "0 8px 32px 0 rgba(0, 0, 128, 0.15), 0 0 0 1px rgba(255,255,255,0.1) inset",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border =
                "1px solid rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.boxShadow =
                "0 12px 40px 0 rgba(0, 0, 128, 0.25), 0 0 0 1px rgba(255,255,255,0.15) inset";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border =
                "1px solid rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.boxShadow =
                "0 8px 32px 0 rgba(0, 0, 128, 0.15), 0 0 0 1px rgba(255,255,255,0.1) inset";
            }}
          >
            {/* Inner highlight */}
            <div className="absolute inset-0 rounded-none bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Max Trades Per Day
                </h3>
              </div>
              {isEditing ? (
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={planData.maxTradesPerDay}
                  onChange={(e) =>
                    handleInputChange("maxTradesPerDay", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="e.g., 3"
                />
              ) : (
                <p className="text-3xl font-bold text-gray-900">
                  {planData.maxTradesPerDay || "Not set"}
                </p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                Helps prevent overtrading and maintain discipline
              </p>
            </div>
          </motion.div>

          {/* Risk Per Trade */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-6 rounded-none backdrop-blur-xl transition-all duration-300 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow:
                "0 8px 32px 0 rgba(0, 0, 128, 0.15), 0 0 0 1px rgba(255,255,255,0.1) inset",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border =
                "1px solid rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.boxShadow =
                "0 12px 40px 0 rgba(0, 0, 128, 0.25), 0 0 0 1px rgba(255,255,255,0.15) inset";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border =
                "1px solid rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.boxShadow =
                "0 8px 32px 0 rgba(0, 0, 128, 0.15), 0 0 0 1px rgba(255,255,255,0.1) inset";
            }}
          >
            {/* Inner highlight */}
            <div className="absolute inset-0 rounded-none bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <ShieldCheckIcon className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Risk Per Trade
                </h3>
              </div>
              {isEditing ? (
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={planData.riskPercentPerTrade}
                    onChange={(e) =>
                      handleInputChange("riskPercentPerTrade", e.target.value)
                    }
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="e.g., 1"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    %
                  </span>
                </div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">
                  {planData.riskPercentPerTrade
                    ? `${planData.riskPercentPerTrade}%`
                    : "Not set"}
                </p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                Percentage of account risked per trade
              </p>
            </div>
          </motion.div>

          {/* Risk-Reward Ratio */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-6 rounded-none backdrop-blur-xl transition-all duration-300 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow:
                "0 8px 32px 0 rgba(0, 0, 128, 0.15), 0 0 0 1px rgba(255,255,255,0.1) inset",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border =
                "1px solid rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.boxShadow =
                "0 12px 40px 0 rgba(0, 0, 128, 0.25), 0 0 0 1px rgba(255,255,255,0.15) inset";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border =
                "1px solid rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.boxShadow =
                "0 8px 32px 0 rgba(0, 0, 128, 0.15), 0 0 0 1px rgba(255,255,255,0.1) inset";
            }}
          >
            {/* Inner highlight */}
            <div className="absolute inset-0 rounded-none bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Risk-Reward Ratio
                </h3>
              </div>
              {isEditing ? (
                <div className="space-y-3">
                  <select
                    value={planData.targetRiskRewardRatio}
                    onChange={(e) =>
                      handleInputChange("targetRiskRewardRatio", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="1">1:1</option>
                    <option value="1.5">1:1.5</option>
                    <option value="2">1:2</option>
                    <option value="3">1:3</option>
                    <option value="custom">Custom</option>
                  </select>
                  {planData.targetRiskRewardRatio === "custom" && (
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={planData.customRiskReward}
                      onChange={(e) =>
                        handleInputChange("customRiskReward", e.target.value)
                      }
                      placeholder="Enter custom ratio (e.g., 2.5)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  )}
                </div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">
                  {getRiskRewardDisplay()}
                </p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                Target risk-to-reward ratio for your trades
              </p>
            </div>
          </motion.div>

          {/* Stop-Loss Discipline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="p-6 rounded-none backdrop-blur-xl transition-all duration-300 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow:
                "0 8px 32px 0 rgba(0, 0, 128, 0.15), 0 0 0 1px rgba(255,255,255,0.1) inset",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border =
                "1px solid rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.boxShadow =
                "0 12px 40px 0 rgba(0, 0, 128, 0.25), 0 0 0 1px rgba(255,255,255,0.15) inset";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border =
                "1px solid rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.boxShadow =
                "0 8px 32px 0 rgba(0, 0, 128, 0.15), 0 0 0 1px rgba(255,255,255,0.1) inset";
            }}
          >
            {/* Inner highlight */}
            <div className="absolute inset-0 rounded-none bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <ShieldCheckIcon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Stop-Loss Discipline
                </h3>
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  {[
                    {
                      value: "ALWAYS",
                      label: "Always use a stop-loss",
                    },
                    {
                      value: "FLEXIBLE",
                      label: "Sometimes flexible",
                    },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="radio"
                        name="stopLoss"
                        checked={planData.stopLossDiscipline === option.value}
                        onChange={() =>
                          handleInputChange("stopLossDiscipline", option.value)
                        }
                        className="w-5 h-5 text-primary focus:ring-primary border-gray-300"
                      />
                      <span className="ml-3 text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {planData.stopLossDiscipline === "ALWAYS"
                    ? "Always"
                    : "Flexible"}
                </p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                Your approach to stop-loss management
              </p>
            </div>
          </motion.div>
        </div>

        {/* Preferred Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6 p-6 rounded-none backdrop-blur-xl transition-all duration-300 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow:
              "0 8px 32px 0 rgba(0, 0, 128, 0.15), 0 0 0 1px rgba(255,255,255,0.1) inset",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.2)";
            e.currentTarget.style.boxShadow =
              "0 12px 40px 0 rgba(0, 0, 128, 0.25), 0 0 0 1px rgba(255,255,255,0.15) inset";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.border =
              "1px solid rgba(255, 255, 255, 0.15)";
            e.currentTarget.style.boxShadow =
              "0 8px 32px 0 rgba(0, 0, 128, 0.15), 0 0 0 1px rgba(255,255,255,0.1) inset";
          }}
        >
          {/* Inner highlight */}
          <div className="absolute inset-0 rounded-none bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <GlobeAltIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Preferred Trading Sessions
              </h3>
            </div>
            {isEditing ? (
              <div className="space-y-2">
                {[
                  { value: "LONDON", label: "London Session" },
                  { value: "NY", label: "New York Session" },
                  { value: "ASIA", label: "Asia Session" },
                ].map((session) => (
                  <label
                    key={session.value}
                    className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={planData.preferredSessions.includes(
                        session.value
                      )}
                      onChange={() => handleSessionToggle(session.value)}
                      className="w-5 h-5 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <span className="ml-3 text-gray-700">{session.label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {planData.preferredSessions.length > 0 ? (
                  planData.preferredSessions.map((session) => (
                    <span
                      key={session}
                      className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium"
                    >
                      {getSessionLabel(session)}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No sessions selected</p>
                )}
              </div>
            )}
            <p className="mt-4 text-sm text-gray-500">
              Trading sessions you typically trade during
            </p>
          </div>
        </motion.div>

        {/* Summary Card */}
        {!isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-6 p-6 rounded-none backdrop-blur-xl transition-all duration-300 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow:
                "0 8px 32px 0 rgba(0, 0, 128, 0.15), 0 0 0 1px rgba(255,255,255,0.1) inset",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border =
                "1px solid rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.boxShadow =
                "0 12px 40px 0 rgba(0, 0, 128, 0.25), 0 0 0 1px rgba(255,255,255,0.15) inset";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border =
                "1px solid rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.boxShadow =
                "0 8px 32px 0 rgba(0, 0, 128, 0.15), 0 0 0 1px rgba(255,255,255,0.1) inset";
            }}
          >
            {/* Inner highlight */}
            <div className="absolute inset-0 rounded-none bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Summary
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Daily Trade Limit:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {planData.maxTradesPerDay} trades
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Risk Per Trade:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {planData.riskPercentPerTrade}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Target R:R:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {getRiskRewardDisplay()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Stop-Loss:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {planData.stopLossDiscipline === "ALWAYS"
                      ? "Always Required"
                      : "Flexible"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}
