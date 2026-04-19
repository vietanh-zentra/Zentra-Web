"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  XMarkIcon,
  CheckCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { apiClient } from "@/utils/api";
import GlassmorphicButton from "@/components/GlassmorphicButton";
import Button from "./Button";

export default function OnboardingModal({ isOpen, onComplete }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    maxTradesPerDay: "",
    riskPercentPerTrade: "",
    targetRiskRewardRatio: "1.5",
    customRiskReward: "",
    preferredSessions: [],
    stopLossDiscipline: "ALWAYS",
  });

  const totalSteps = 3;

  // Load existing trading plan when modal opens
  useEffect(() => {
    const loadExistingPlan = async () => {
      if (!isOpen) return;

      const onboardingComplete = localStorage.getItem("onboardingComplete");
      if (!onboardingComplete) return; // Skip loading if first time

      setIsLoading(true);
      try {
        const plan = await apiClient.getTradingPlan();
        if (plan) {
          // Check if risk reward is a standard value or custom
          const standardValues = ["1", "1.5", "2", "3"];
          const riskReward = plan.targetRiskRewardRatio.toString();
          const isCustom = !standardValues.includes(riskReward);

          setFormData({
            maxTradesPerDay: plan.maxTradesPerDay.toString(),
            riskPercentPerTrade: plan.riskPercentPerTrade.toString(),
            targetRiskRewardRatio: isCustom ? "custom" : riskReward,
            customRiskReward: isCustom ? riskReward : "",
            preferredSessions: plan.preferredSessions || [],
            stopLossDiscipline: plan.stopLossDiscipline,
          });
        }
      } catch (error) {
        console.error("Error loading trading plan:", error);
        // Continue with empty form if loading fails
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingPlan();
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSessionToggle = (session) => {
    setFormData((prev) => ({
      ...prev,
      preferredSessions: prev.preferredSessions.includes(session)
        ? prev.preferredSessions.filter((s) => s !== session)
        : [...prev.preferredSessions, session],
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.maxTradesPerDay &&
          Number(formData.maxTradesPerDay) > 0 &&
          formData.riskPercentPerTrade &&
          Number(formData.riskPercentPerTrade) > 0 &&
          Number(formData.riskPercentPerTrade) <= 100
        );
      case 2:
        const riskReward =
          formData.targetRiskRewardRatio === "custom"
            ? formData.customRiskReward
            : formData.targetRiskRewardRatio;
        return (
          riskReward &&
          Number(riskReward) > 0 &&
          formData.preferredSessions.length > 0 &&
          formData.stopLossDiscipline
        );
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const riskReward =
        formData.targetRiskRewardRatio === "custom"
          ? Number(formData.customRiskReward)
          : Number(formData.targetRiskRewardRatio);

      if (Number(formData.riskPercentPerTrade) > 100) {
        alert("Max risk per trade cannot exceed 100%.");
        return;
      }

      await apiClient.createOrUpdateTradingPlan({
        maxTradesPerDay: Number(formData.maxTradesPerDay),
        riskPercentPerTrade: Number(formData.riskPercentPerTrade),
        targetRiskRewardRatio: riskReward,
        preferredSessions: formData.preferredSessions,
        stopLossDiscipline: formData.stopLossDiscipline,
      });

      // Check if this is first time or editing
      const isFirstTime = !localStorage.getItem("onboardingComplete");

      // Mark onboarding as complete
      localStorage.setItem("onboardingComplete", "true");

      // Close modal with smooth transition
      onComplete?.(isFirstTime);
    } catch (error) {
      console.error("Error saving trading plan:", error);
      alert("Failed to save trading plan. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      router.push("/auth/login");
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <style
            dangerouslySetInnerHTML={{
              __html: `
            button.modal-submit-btn,
            button.modal-submit-btn * {
              color: white !important;
            }
          `,
            }}
          />

          {/* Logout Button - Bottom Left of Viewport */}
          <button
            onClick={handleLogout}
            className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2 text-sm text-white bg-gray-800/80 hover:bg-gray-900/90 backdrop-blur-sm transition-colors rounded-lg shadow-lg"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span>Logout</span>
          </button>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={() => onComplete(false)}
              className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-200 shrink-0">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-tertiary"
                initial={{ width: 0 }}
                animate={{
                  width: `${(currentStep / totalSteps) * 100}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {/* Header */}
              <div className="mb-4">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {currentStep === 1 && "Set Your Trading Limits"}
                  {currentStep === 2 && "Define Your Strategy"}
                  {currentStep === 3 && "Review & Confirm"}
                </h2>
                <p className="text-gray-600">
                  {currentStep === 1 &&
                    "Let's establish your risk management parameters"}
                  {currentStep === 2 &&
                    "Configure your trading approach and sessions"}
                  {currentStep === 3 &&
                    "Final check before your dashboard loads."}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <span>
                    Step {currentStep} of {totalSteps}
                  </span>
                  {localStorage.getItem("onboardingComplete") && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      Editing Preferences
                    </span>
                  )}
                </div>
              </div>

              {/* Step Content */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-600">Loading your preferences...</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Step 1: Trading Limits */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            How many trades or setups do you typically allow
                            yourself per day/session?
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={formData.maxTradesPerDay}
                            onChange={(e) =>
                                handleInputChange(
                                  "maxTradesPerDay",
                                  e.target.value
                                )
                              }
                            placeholder="e.g., 3"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          />
                          <p className="mt-1 text-sm text-gray-500">
                            This helps prevent overtrading and maintain
                            discipline
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            What is your maximum risk per trade?
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0.1"
                              max="100"
                              step="0.1"
                              value={formData.riskPercentPerTrade}
                              onChange={(e) =>
                                handleInputChange(
                                  "riskPercentPerTrade",
                                  e.target.value
                                )
                              }
                              placeholder="e.g., 1"
                              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                              %
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            Percentage of your account you're willing to risk
                            per trade
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Trading Strategy */}
                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            What Risk-to-Reward ratio do you typically aim for?
                          </label>
                          <select
                            value={formData.targetRiskRewardRatio}
                            onChange={(e) =>
                              handleInputChange(
                                "targetRiskRewardRatio",
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          >
                            <option value="1">1:1</option>
                            <option value="1.5">1:1.5</option>
                            <option value="2">1:2</option>
                            <option value="3">1:3</option>
                            <option value="custom">Custom</option>
                          </select>
                          {formData.targetRiskRewardRatio === "custom" && (
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={formData.customRiskReward}
                              onChange={(e) =>
                                handleInputChange(
                                  "customRiskReward",
                                  e.target.value
                                )
                              }
                              placeholder="Enter custom ratio (e.g., 2.5)"
                              className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Which trading sessions do you normally trade?
                          </label>
                          <p className="text-sm text-gray-500 mb-3">
                            This helps Zentra analyse your performance across
                            different market sessions.
                          </p>
                          <div className="space-y-2">
                            {[
                              { value: "LONDON", label: "London Session" },
                              { value: "NY", label: "New York Session" },
                              { value: "ASIA", label: "Asia Session" },
                            ].map((session) => (
                              <label
                                key={session.value}
                                className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.preferredSessions.includes(
                                    session.value
                                  )}
                                  onChange={() =>
                                    handleSessionToggle(session.value)
                                  }
                                  className="w-5 h-5 text-primary focus:ring-primary border-gray-300 rounded"
                                />
                                <span className="ml-3 text-gray-700">
                                  {session.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            How do you usually set your stop-loss?
                          </label>
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
                                  checked={
                                    formData.stopLossDiscipline === option.value
                                  }
                                  onChange={() =>
                                    handleInputChange(
                                      "stopLossDiscipline",
                                      option.value
                                    )
                                  }
                                  className="w-5 h-5 text-primary focus:ring-primary border-gray-300"
                                />
                                <span className="ml-3 text-gray-700">
                                  {option.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Review */}
                    {currentStep === 3 && (
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                          <h3 className="font-semibold text-gray-900 text-lg mb-4">
                            Your Trading Plan Summary
                          </h3>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">
                                Max Trades Per Day
                              </p>
                              <p className="text-lg font-semibold text-gray-900">
                                {formData.maxTradesPerDay}
                              </p>
                            </div>

                            <div>
                              <p className="text-sm text-gray-600">
                                Max Risk Per Trade
                              </p>
                              <p className="text-lg font-semibold text-gray-900">
                                {formData.riskPercentPerTrade}%
                              </p>
                            </div>

                            <div>
                              <p className="text-sm text-gray-600">
                                Target Risk-Reward
                              </p>
                              <p className="text-lg font-semibold text-gray-900">
                                1:
                                {formData.targetRiskRewardRatio === "custom"
                                  ? formData.customRiskReward
                                  : formData.targetRiskRewardRatio}
                              </p>
                            </div>

                            <div>
                              <p className="text-sm text-gray-600">
                                Stop-Loss Approach
                              </p>
                              <p className="text-lg font-semibold text-gray-900">
                                {formData.stopLossDiscipline === "ALWAYS"
                                  ? "Always"
                                  : "Flexible"}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-gray-600 mb-2">
                              Preferred Sessions
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {formData.preferredSessions.map((session) => (
                                <span
                                  key={session}
                                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                                >
                                  {session === "NY"
                                    ? "New York"
                                    : session === "LONDON"
                                    ? "London"
                                    : session === "ASIA"
                                    ? "Asia"
                                    : session}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-blue-800">
                            💡 You can always update your trading plan later by
                            clicking "Set Preferences" in the Quick Actions
                            menu.
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {/* Action Buttons */}
            {!isLoading && (
              <div className="p-6 border-t border-gray-200 bg-white shrink-0">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className="px-6 py-3 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Back
                  </button>

                  <GlassmorphicButton
                    onClick={handleNext}
                    disabled={!isStepValid() || isSubmitting}
                    className="px-6 py-3"
                    icon={
                      isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : null
                    }
                  >
                    {isSubmitting
                      ? "Saving..."
                      : currentStep === totalSteps
                      ? "Complete Setup"
                      : "Next"}
                  </GlassmorphicButton>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
