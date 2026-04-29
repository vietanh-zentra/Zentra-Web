"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {apiClient} from "@/utils/api";
import { useRouter } from "next/navigation";
import {
  ChartBarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";
import { useDashboardSummary } from "@/app/hooks/useDashboard";
import { usePsychologicalStateContext } from "@/context/PsychologicalStateContext";
import { useTrades } from "@/app/hooks/useTrades";
import { useUser } from "@/app/hooks/useUser";
import {
  useMentalBattery,
  usePlanControl,
  useBehaviorHeatmap,
  usePsychologicalRadar,
  useBreathworkSuggestion,
  usePerformanceWindow,
  useConsistencyTrend,
  useDailyQuote,
} from "@/app/hooks/useZentraV2";
import LoadingSpinner from "@/components/LoadingSpinner";
import OnboardingModal from "@/components/OnboardingModal";
import Toast from "@/components/Toast";
import { STATE_CONFIG } from "@/components/StateIndicator";
import Brain3D from "@/components/Brain3D";
import GlassmorphicButton from "@/components/GlassmorphicButton";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../../tailwind.config.js";
import { useTradingPlan } from "@/context/TradingPlanContext";
import MentalBatteryCard from "@/components/dashboard/widgets/MentalBatteryCard";
import PlanControlCard from "@/components/dashboard/widgets/PlanControlCard";
import BehaviourHeatmap from "@/components/dashboard/widgets/BehaviourHeatmap";
import PsychologicalStabilityTrend from "@/components/dashboard/widgets/PsychologicalStabilityTrend";
import ZentraBreathwork from "@/components/dashboard/widgets/ZentraBreathwork";
import QuoteOfTheDay from "@/components/dashboard/widgets/QuoteOfTheDay";
import PerformanceWindow from "@/components/dashboard/widgets/PerformanceWindow";
import PsychologicalStateDistribution from "@/components/dashboard/widgets/PsychologicalStateDistribution";
import MT5AccountCard from "@/components/dashboard/widgets/MT5AccountCard";
import PerformanceMetricsCard from "@/components/dashboard/widgets/PerformanceMetricsCard";
import MT5PositionsCard from "@/components/dashboard/widgets/MT5PositionsCard";
import OrderHistoryCard from "@/components/dashboard/widgets/OrderHistoryCard";
import MarketInfoCard from "@/components/dashboard/widgets/MarketInfoCard";
import RevengeTradingCard from "@/components/dashboard/widgets/RevengeTradingCard";
import EarlyExitCard from "@/components/dashboard/widgets/EarlyExitCard";
import OvertradingCard from "@/components/dashboard/widgets/OvertradingCard";
import { useRevengeTrading, useEarlyExits, useOvertrading } from "@/app/hooks/useBehavior";

const fullConfig = resolveConfig(tailwindConfig);
const colors = fullConfig.theme.colors;

// Helper function to convert hex to rgba
const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function Dashboard() {
  const router = useRouter();
  const [period, setPeriod] = useState("MONTH");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  useEffect(() => {
    console.log("CURSOR RESET DUE TO DATE CHANGE");
  }, [selectedDate]);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const tradingPlanContext = useTradingPlan();
  const hasTradingPlan = tradingPlanContext?.hasTradingPlan ?? null;
  const planStatusLoading = tradingPlanContext?.statusLoading ?? true;
  const refreshTradingPlanStatus = tradingPlanContext?.refreshStatus;
  const setHasTradingPlan = tradingPlanContext?.setHasTradingPlan;
  const [brainSize, setBrainSize] = useState(400);

  // Plan Control uses the onboarding trading plan (V1) to compute compliance.
  const [tradingPlan, setTradingPlan] = useState(null);
  const [tradingPlanLoading, setTradingPlanLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTradingPlan() {
      if (hasTradingPlan !== true) {
        setTradingPlan(null);
        setTradingPlanLoading(false);
        return;
      }

      setTradingPlanLoading(true);
      try {
        console.log("FETCHING TRADING PLAN FOR PLAN CONTROL");
        const plan = await apiClient.getTradingPlan();
        if (cancelled) return;
        setTradingPlan(plan);
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching trading plan for Plan Control:", err);
        setTradingPlan(null);
      } finally {
        if (cancelled) return;
        setTradingPlanLoading(false);
      }
    }

    loadTradingPlan();
    return () => {
      cancelled = true;
    };
  }, [hasTradingPlan]);
  const {
    data: summaryData,
    loading: summaryLoading,
    error: summaryError,
    errorStatus: summaryErrorStatus,
    refetch: refetchSummary,
  } = useDashboardSummary(period, selectedDate);
  const {
    data: stateData,
    loading: stateLoading = true,
    error: stateError,
    errorStatus: stateErrorStatus,
    refetch: refetchState,
  } = usePsychologicalStateContext() || {};
  const { data: tradesData, loading: tradesLoading } = useTrades({
    page: 1,
    limit: 1000, // Fetch enough trades to calculate the rate
  }); // Changed from limit: 1 to get all trades
  const { data: userData, loading: userLoading } = useUser();

  // Zentra V2 hooks
  const { data: mentalBatteryData, loading: mentalBatteryLoading } =
    useMentalBattery(selectedDate);
  const { data: planControlData, loading: planControlLoading } =
    usePlanControl(selectedDate);
  const {
    data: behaviorHeatmapData,
    loading: behaviorHeatmapLoading,
    fetchHistory: fetchBehaviorHeatmapHistory,
  } = useBehaviorHeatmap(selectedDate);
  const { data: psychologicalRadarData, loading: psychologicalRadarLoading } =
    usePsychologicalRadar(selectedDate);
  const { data: breathworkData, loading: breathworkLoading } =
    useBreathworkSuggestion(selectedDate);
  const { data: performanceWindowData, loading: performanceWindowLoading } =
    usePerformanceWindow(selectedDate);
  const {
    data: consistencyTrendData,
    loading: consistencyTrendLoading,
    fetchHistory: fetchConsistencyTrendHistory,
    refetch: refetchConsistencyTrend,
  } = useConsistencyTrend("7", selectedDate);
  const { data: dailyQuoteData, loading: dailyQuoteLoading } = useDailyQuote(selectedDate);

  // Behavioral Analysis hooks (Phase 2)
  const { data: revengeData, loading: revengeLoading } = useRevengeTrading(selectedDate);
  const { data: earlyExitData, loading: earlyExitLoading } = useEarlyExits(selectedDate);
  const { data: overtradingData, loading: overtradingLoading } = useOvertrading(selectedDate);

  // Transform v2 data for widgets
  // Transform consistency trend data to preserve date and score for PsychologicalStabilityTrend
  console.log("🔄 [Dashboard] Raw consistencyTrendData:", consistencyTrendData);
  const transformedConsistencyData =
    consistencyTrendData?.trend && Array.isArray(consistencyTrendData.trend)
      ? consistencyTrendData.trend.map((entry) => ({
          ...entry,
          date: entry.date,
          score: entry.score || entry.value || 0,
        }))
      : consistencyTrendData?.scores && Array.isArray(consistencyTrendData.scores)
        ? consistencyTrendData.scores.map((entry) => ({
            ...entry,
            date: entry.date,
            score: entry.score || entry.value || 0,
          }))
        : consistencyTrendData?.data && Array.isArray(consistencyTrendData.data)
          ? consistencyTrendData.data.map((entry) => ({
              ...entry,
              date: entry.date,
              score: entry.score || entry.value || 0,
            }))
          : consistencyTrendData?.history &&
            Array.isArray(consistencyTrendData.history)
            ? consistencyTrendData.history.map((entry) => ({
                ...entry,
                date: entry.date,
                score: entry.score || entry.value || 0,
              }))
            : Array.isArray(consistencyTrendData)
              ? consistencyTrendData
              : null;
  console.log(
    "✅ [Dashboard] Transformed consistency data:",
    transformedConsistencyData,
  );


  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Transform psychological radar data to object format for PsychologicalStateDistribution
  // Transform psychological radar data to object format for PsychologicalStateDistribution
  const transformedRadarData =
    // Case 1: Data has a 'traits' object (New v2 format)
    psychologicalRadarData?.traits &&
      !Array.isArray(psychologicalRadarData.traits) &&
      typeof psychologicalRadarData.traits === "object"
      ? psychologicalRadarData.traits
      : // Case 2: Data has a 'traits' array (Previous format)
      psychologicalRadarData?.traits &&
        Array.isArray(psychologicalRadarData.traits)
        ? Object.fromEntries(
          psychologicalRadarData.traits.map((trait) => [
            trait.name || trait.trait,
            trait.value || trait.score || 0,
          ]),
        )
        : // Case 3: Data is in 'data' property
        psychologicalRadarData?.data &&
          typeof psychologicalRadarData.data === "object" &&
          psychologicalRadarData.data !== null
          ? Object.fromEntries(
            Object.entries(psychologicalRadarData.data).map(
              ([key, value]) => [
                key,
                typeof value === "object" && value !== null
                  ? value.value || value.score || 0
                  : value,
              ],
            ),
          )
          : // Case 4: Data IS the object (fallback), but exclude if it looks like a wrapper with 'traits' or 'message'
          psychologicalRadarData &&
            typeof psychologicalRadarData === "object" &&
            !Array.isArray(psychologicalRadarData) &&
            !psychologicalRadarData.traits &&
            !psychologicalRadarData.message
            ? psychologicalRadarData
            : null;
  const retryTimeoutRef = useRef(null);
  const retryAttemptsRef = useRef(0);
  useEffect(() => {
    const hasPlan = hasTradingPlan === true;
    const shouldRetry =
      hasPlan && (summaryErrorStatus === 403 || stateErrorStatus === 403);

    if (shouldRetry) {
      if (retryAttemptsRef.current >= 3) {
        return;
      }

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      retryTimeoutRef.current = setTimeout(() => {
        retryAttemptsRef.current += 1;
        refetchSummary();
        if (typeof refetchState === "function") {
          refetchState();
        }
        retryTimeoutRef.current = null;
      }, 1200);
    } else if (
      retryAttemptsRef.current &&
      summaryErrorStatus !== 403 &&
      stateErrorStatus !== 403
    ) {
      retryAttemptsRef.current = 0;
    }
  }, [
    hasTradingPlan,
    summaryErrorStatus,
    stateErrorStatus,
    refetchSummary,
    refetchState,
  ]);
  // Sync onboarding modal with trading plan context status
  useEffect(() => {
    if (planStatusLoading) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    if (hasTradingPlan) {
      localStorage.setItem("onboardingComplete", "true");
      setShowOnboarding(false);
    } else if (hasTradingPlan === false) {
      localStorage.removeItem("onboardingComplete");
      setShowOnboarding(true);
    }
  }, [hasTradingPlan, planStatusLoading]);

  // Update brain size based on window width
  useEffect(() => {
    const updateBrainSize = () => {
      if (typeof window !== "undefined") {
        if (window.innerWidth < 640) {
          setBrainSize(250);
        } else if (window.innerWidth < 1024) {
          setBrainSize(350);
        } else {
          setBrainSize(400);
        }
      }
    };

    updateBrainSize();
    window.addEventListener("resize", updateBrainSize);
    return () => window.removeEventListener("resize", updateBrainSize);
  }, []);

  const handleOnboardingComplete = async (isFirstTime = false) => {
    setShowOnboarding(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("onboardingComplete", "true");
    }

    if (isFirstTime && typeof setHasTradingPlan === "function") {
      setHasTradingPlan(true);
    }

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

    // Refetch dashboard data after trading plan is created
    try {
      await Promise.all([
        refetchSummary(),
        typeof refetchState === "function" ? refetchState() : Promise.resolve(),
      ]);
    } catch (error) {
      // Errors are handled by the hooks, just log if needed
      console.log("Refetching data after plan creation");
    }

    if (isFirstTime) {
      router.refresh();
    }
  };

  const handleOpenPreferences = () => {
    setShowOnboarding(true);
  };

  // Check for trading plan required error (403) and handle appropriately
  // MUST be called before any conditional returns (Rules of Hooks)
  useEffect(() => {
    const error = summaryError || stateError;
    const errorStatus = summaryErrorStatus || stateErrorStatus;

    if (
      hasTradingPlan === false &&
      errorStatus === 403 &&
      error &&
      !showOnboarding
    ) {
      const errorMessage = error.toLowerCase();
      if (
        errorMessage.includes("trading plan") ||
        errorMessage.includes("trading plan required")
      ) {
        router.push("/dashboard/plan");
        return;
      }
    }
  }, [
    summaryError,
    stateError,
    summaryErrorStatus,
    stateErrorStatus,
    router,
    showOnboarding,
    hasTradingPlan,
  ]);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const waitingForPlanStatus = planStatusLoading && hasTradingPlan === null;

  // Get total trades count
  const totalTrades = tradesData?.totalResults || 0;
  const hasEnoughTrades = totalTrades >= 5;
  const hasNoTrades = !tradesLoading && totalTrades === 0;

  // Date-specific empty states (prevents stale UI when selectedDate has no trades)
  const hasMentalBatteryNoData = mentalBatteryData === null;
  const hasPsychologicalTraitsNoData = psychologicalRadarData === null;
  const hasStabilityTrendNoData = consistencyTrendData === null;

  // Calculate early exit rate from trades
  const trades = tradesData?.results || [];
  const earlyExitCount = trades.filter(
    (trade) => trade.exitedEarly === true,
  ).length;
  const isSameDay = (dateA, dateB) => {
    if (!dateA || !dateB) return false;
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate()
    );
  };
  const now = new Date();
  const todaysTradesCount = trades.filter((trade) => {
    const entry = trade?.entryTime ? new Date(trade.entryTime) : null;
    const created = trade?.createdAt ? new Date(trade.createdAt) : null;
    return isSameDay(entry || created, now);
  }).length;
  const earlyExitRate =
    totalTrades > 0 ? Math.round((earlyExitCount / totalTrades) * 100) : 0;

  // Show loading state
  if (
    summaryLoading ||
    stateLoading ||
    tradesLoading ||
    waitingForPlanStatus ||
    tradingPlanLoading ||
    userLoading ||
    psychologicalRadarLoading
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="w-16 h-16" />
      </div>
    );
  }

  // Show error state (only if not a trading plan error or if modal is open)
  if (summaryError || stateError) {
    const errorStatus = summaryErrorStatus || stateErrorStatus;
    const errorMessage = (summaryError || stateError || "").toLowerCase();

    // Don't show error UI if:
    // 1. It's a trading plan error and modal is open (expected behavior - user will create plan via modal)
    // 2. It's a trading plan error and we're redirecting
    const isTradingPlanError =
      errorStatus === 403 &&
      (errorMessage.includes("trading plan") ||
        errorMessage.includes("trading plan required"));

    if (isTradingPlanError) {
      if (hasTradingPlan === false) {
        // If modal is open, continue rendering (modal will show, errors are expected)
        if (showOnboarding) {
          // Continue to render - the modal will be shown and handle plan creation
          // Don't return early, let the component render normally with the modal
        } else {
          // Modal not open, redirecting - show loading
          return (
            <div className="min-h-screen flex items-center justify-center">
              <LoadingSpinner className="w-16 h-16" />
            </div>
          );
        }
      } else {
        return (
          <div className="min-h-screen flex items-center justify-center p-6">
            <div className="text-center space-y-4">
              <LoadingSpinner className="w-12 h-12 mx-auto" />
              <p className="text-gray-700 font-medium">
                Finalizing your trading plan. Refreshing data...
              </p>
            </div>
          </div>
        );
      }
    }

    // Non-trading plan error - show error UI (unless modal is open)
    if (!showOnboarding) {
      return (
        <div className="min-h-screen p-6">
          <div className="max-w-[1800px] mx-auto">
            <div className="p-6 bg-red-500/20 border border-red-500/50 rounded-xl backdrop-blur-md shadow-[0_10px_30px_-10px_rgba(220,38,38,0.35)]">
              <h2 className="text-xl font-bold text-red-500 mb-2">
                Error Loading Dashboard
              </h2>
              <p className="text-red-400">{summaryError || stateError}</p>
              <p className="text-red-400 mt-2">
                Please make sure your backend is running on
                http://localhost:2000
              </p>
            </div>
          </div>
        </div>
      );
    }
    // If modal is open and it's a non-trading-plan error, still show modal
    // but the dashboard content won't render due to missing data
  }

  // Map backend state to frontend state
  const stateMapping = {
    STABLE: "stable",
    OVEREXTENDED: "overtrading",
    HESITANT: "hesitant",
    AGGRESSIVE: "aggressive",
  };

  const currentState = stateData?.state
    ? stateMapping[stateData.state] || "stable"
    : "stable";

  const metrics = summaryData?.quickStats
    ? {
      winRate: summaryData.quickStats.winRate || 0,
      avgTrade: summaryData.quickStats.avgRiskReward || 0,
      riskReward: summaryData.quickStats.avgRiskReward || 0,
      tradesToday: todaysTradesCount,
      maxTrades: 5,
      planCompliance: summaryData.quickStats.confidence || 0,
      earlyExitRate: earlyExitRate, // Use calculated value instead of API
    }
    : {
      winRate: 0,
      avgTrade: 0,
      riskReward: 0,
      tradesToday: todaysTradesCount,
      maxTrades: 5,
      planCompliance: 0,
      earlyExitRate: earlyExitRate, // Use calculated value
    };

  const states = {
    focused: {
      ...STATE_CONFIG.focused,
      icon: CheckCircleIcon,
      description:
        "You're in a focused state. Your decision-making is clear and you're following your plan well.",
      recommendations: stateData?.recommendations || [
        "Continue with current strategy",
        "Monitor for fatigue",
        "Take breaks as planned",
      ],
    },
    overtrading: {
      ...STATE_CONFIG.overtrading,
      icon: ExclamationTriangleIcon,
      description:
        "You're showing signs of overtrading. Consider reducing trade frequency.",
      recommendations: stateData?.recommendations || [
        "Reduce trade frequency",
        "Review your plan",
        "Take a break",
      ],
    },
    hesitant: {
      ...STATE_CONFIG.hesitant,
      icon: ClockIcon,
      description:
        "You're being overly cautious. This might be limiting your opportunities.",
      recommendations: stateData?.recommendations || [
        "Review your risk tolerance",
        "Trust your analysis",
        "Set clear entry criteria",
      ],
    },
    aggressive: {
      ...STATE_CONFIG.aggressive,
      icon: ExclamationTriangleIcon,
      description:
        "You're in an aggressive state. Be mindful of risk management.",
      recommendations: stateData?.recommendations || [
        "Reduce position sizes",
        "Stick to stop losses",
        "Review risk parameters",
      ],
    },
    stable: {
      ...STATE_CONFIG.stable,
      icon: CheckCircleIcon,
      description: "You're in a stable, balanced state. Keep up the good work!",
      recommendations: stateData?.recommendations || [
        "Maintain current approach",
        "Continue monitoring",
        "Stay disciplined",
      ],
    },
  };

  const currentStateData = states[currentState] || states.stable;

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <>
      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: "", type: "success" })}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      <div className="min-h-screen pt-28 pb-[30px] relative w-full bg-[#DDE7E7]">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8">
          {/* Header */}
          <div className=" w-full flex items-center justify-between ">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-[36px] font-[500] text-[#363636] mb-2">
                Dashboard Overview
              </h1>
              <p className="text-xl text-[#363636] font-medium">
                {getGreeting()},{" "}
                {userData?.name ? userData.name.split(" ")[0] : "Hamail"}
              </p>
            </div>



            {/* Date Picker oF dashboard */}

            <div className="flex items-center gap-2 justify-center relative">
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex text-[#363636] items-center gap-1 px-3 py-1.5 bg-[#F2F7F7] rounded-full text-[16px] font-normal border border-[#fff]"
              >
                {formatDate(selectedDate)}
                <ChevronDownIcon className="w-3 h-3 stroke-[3] text-[#363636]" />
              </button>

              {showCalendar && (
                <div className="absolute top-10 right-0 z-50 bg-white p-3 rounded-xl shadow-xl border border-gray-200">
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        console.log("SELECTED DATE:", date);
                      }
                      setShowCalendar(false);
                    }}
                    captionLayout="dropdown-buttons"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Main Grid Structure - 4 Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-4  gap-3 items-stretch">
            {/* Column 1 - Mental Battery (Spans 2 rows of height) */}
            <div className="flex flex-col row-span-2">
              <div className="">
                <MentalBatteryCard
                  percentage={
                    mentalBatteryData?.battery ?? 0
                  }
                  level={
                    mentalBatteryData?.status === "optimal"
                      ? "Optimal"
                      : mentalBatteryData?.status === "strained"
                        ? "Strained"
                        : mentalBatteryData?.status === "high_risk"
                          ? "High Risk"
                          : "Stable"
                  }
                  message={mentalBatteryData?.message}
                  drainFactors={mentalBatteryData?.drainFactors}
                  rechargeFactors={mentalBatteryData?.rechargeFactors}
                  hasNoTrades={hasMentalBatteryNoData}
                />
              </div>
            </div>

            {/* Middle Section (Columns 2 & 3) */}
            <div className="md:col-span-2 flex flex-col gap-4 sm:gap-3">
              {/* Row 1: Breathwork (Spans 2 columns) */}
              <div className="">
                <ZentraBreathwork
                  shouldSuggest={breathworkData?.shouldSuggest}
                  message={breathworkData?.message}
                />
              </div>

              {/* Row 2: Plan Control & Psychological Traits (Side by side) */}
              <div className="grid grid-cols-2 gap-4 sm:gap-3">
                <div className="">
                  <PlanControlCard
                    selectedDate={selectedDate}
                    trades={tradesData?.results || []}
                    tradingPlan={tradingPlan}
                  />
                </div>
                <div className="">
                  <PsychologicalStateDistribution
                    data={transformedRadarData}
                    hasNoTrades={hasPsychologicalTraitsNoData}
                    selectedDate={selectedDate}
                    trades={tradesData?.results || []}
                    tradingPlan={tradingPlan}
                  />
                </div>
              </div>
            </div>

            {/* Column 4 - Behaviour Heatmap (Spans 2 rows of height) */}
            <div className="flex flex-col md:row-span-2">
              <div className="">
                <BehaviourHeatmap
                  hasNoTrades={behaviorHeatmapLoading ? false : (!behaviorHeatmapData || behaviorHeatmapData.totalTrades === 0)}
                  fetchHistory={fetchBehaviorHeatmapHistory}
                  selectedDate={selectedDate}
                />
              </div>
            </div>

            {/* Bottom Row - Full Width split 50/50 */}
            <div> </div>
            <div className="md:col-span-2 h-[264px] mt-[-10px]">
              <QuoteOfTheDay
                selectedDate={selectedDate}
              />
            </div>
            <div className="md:col-span-2 h-[264px] mt-[-10px]">
              <PsychologicalStabilityTrend
                selectedDate={selectedDate}
                trades={tradesData?.results || []}
                tradingPlan={tradingPlan}
              />
            </div>
          </div>

          {/* MT5 Data Expansion: Account + Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <MT5AccountCard />
            <PerformanceMetricsCard />
          </div>

          {/* MT5 Live Positions + Pending Orders */}
          <div className="mt-4">
            <MT5PositionsCard />
          </div>

          {/* Order History + Market Watch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <OrderHistoryCard />
            <MarketInfoCard />
          </div>

          {/* Behavioral Analysis Section (Phase 2) */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Behavioral Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <RevengeTradingCard data={revengeData} loading={revengeLoading} />
              <EarlyExitCard data={earlyExitData} loading={earlyExitLoading} />
              <OvertradingCard data={overtradingData} loading={overtradingLoading} />
            </div>
          </div>

          {/* Old layout - keeping for reference but commented out */}
          {false && (
            <div className="grid lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
              {/* Main Brain Visualization or Insufficient Trades Message */}
              <div className="lg:col-span-2">
                {hasEnoughTrades ? (
                  <motion.div
                    key={currentState}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                  >
                    {/* Modern card container with glassmorphism - incorporating state colors */}
                    <div
                      className="p-4 sm:p-6 md:p-8 rounded-2xl backdrop-blur-xl transition-all duration-500 relative overflow-hidden group"
                      style={{
                        background: `linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%)`,
                        border: `1px solid rgba(255, 255, 255, 0.15)`,
                        boxShadow: `0 8px 32px 0 ${hexToRgba(
                          STATE_CONFIG[currentState]?.gradient.start ||
                          colors.tertiary,
                          0.15,
                        )}, 0 0 0 1px rgba(255,255,255,0.1) inset`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.border = `1px solid rgba(255, 255, 255, 0.2)`;
                        e.currentTarget.style.boxShadow = `0 12px 40px 0 ${hexToRgba(
                          STATE_CONFIG[currentState]?.gradient.start ||
                          colors.tertiary,
                          0.25,
                        )}, 0 0 0 1px rgba(255,255,255,0.15) inset`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.border = `1px solid rgba(255, 255, 255, 0.15)`;
                        e.currentTarget.style.boxShadow = `0 8px 32px 0 ${hexToRgba(
                          STATE_CONFIG[currentState]?.gradient.start ||
                          colors.tertiary,
                          0.15,
                        )}, 0 0 0 1px rgba(255,255,255,0.1) inset`;
                      }}
                    >
                      {/* State-colored gradient overlay */}
                      <div
                        className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-500"
                        style={{
                          background: `linear-gradient(135deg, ${hexToRgba(
                            STATE_CONFIG[currentState]?.gradient.start ||
                            colors.tertiary,
                            0.12,
                          )} 0%, ${hexToRgba(
                            STATE_CONFIG[currentState]?.gradient.end ||
                            colors.primary,
                            0.08,
                          )} 100%)`,
                        }}
                      />

                      {/* Subtle state-colored glow */}
                      <div
                        className="absolute inset-0 rounded-2xl pointer-events-none blur-xl transition-all duration-500"
                        style={{
                          background: `radial-gradient(circle at center, ${hexToRgba(
                            STATE_CONFIG[currentState]?.gradient.start ||
                            colors.tertiary,
                            0.2,
                          )} 0%, transparent 70%)`,
                        }}
                      />

                      {/* Inner highlight with state colors */}
                      <div
                        className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-500"
                        style={{
                          background: `linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, transparent 100%)`,
                        }}
                      />

                      <div className="relative z-10">
                        <div className="text-center mb-4 sm:mb-6">
                          <h2
                            className="text-xl sm:text-2xl font-semibold mb-2"
                            style={{
                              color: colors.primary,
                            }}
                          >
                            Current Mental State
                          </h2>
                        </div>

                        {/* 3D Brain Visualization with State Labels */}
                        <div className="relative w-full h-64 sm:h-80 md:h-96 flex items-center justify-center">
                          <Brain3D
                            currentState={currentState}
                            size={brainSize}
                          />
                        </div>

                        {/* State description - glassmorphic panel with state colors */}
                        <div
                          className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl backdrop-blur-md transition-all duration-500"
                          style={{
                            background: `linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.3) 100%)`,
                            border: `1px solid ${hexToRgba(
                              STATE_CONFIG[currentState]?.gradient.start ||
                              colors.tertiary,
                              0.2,
                            )}`,
                            boxShadow: `0 4px 16px 0 ${hexToRgba(
                              STATE_CONFIG[currentState]?.gradient.start ||
                              colors.tertiary,
                              0.1,
                            )}`,
                          }}
                        >
                          <h6
                            className="text-center font-medium text-sm"
                            style={{
                              color: colors.primary,
                            }}
                          >
                            {currentStateData.description}
                          </h6>
                          {stateData && (
                            <div className="mt-4 flex flex-col items-center gap-1 text-center">
                              <div
                                className="text-xs sm:text-sm font-medium tracking-wide uppercase"
                                style={{
                                  color: colors.primary,
                                  letterSpacing: "0.08em",
                                }}
                              >
                                Confidence
                              </div>
                              <div
                                className="text-2xl sm:text-3xl font-semibold"
                                style={{
                                  color: colors.primary,
                                }}
                              >
                                {stateData.confidence || 0}%
                              </div>
                              <p
                                className="text-xs sm:text-sm opacity-70"
                                style={{
                                  color: colors.primary,
                                }}
                              >
                                Based on your recent trade history
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                  >
                    {/* Modern card container with glassmorphism - similar style to mental state card */}
                    <div
                      className="p-4 sm:p-6 md:p-8 rounded-2xl backdrop-blur-xl transition-all duration-500 relative overflow-hidden group"
                      style={{
                        background: `linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%)`,
                        border: `1px solid rgba(255, 255, 255, 0.15)`,
                        boxShadow: `0 8px 32px 0 ${hexToRgba(
                          colors.tertiary,
                          0.15,
                        )}, 0 0 0 1px rgba(255,255,255,0.1) inset`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.border = `1px solid rgba(255, 255, 255, 0.2)`;
                        e.currentTarget.style.boxShadow = `0 12px 40px 0 ${hexToRgba(
                          colors.tertiary,
                          0.25,
                        )}, 0 0 0 1px rgba(255,255,255,0.15) inset`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.border = `1px solid rgba(255, 255, 255, 0.15)`;
                        e.currentTarget.style.boxShadow = `0 8px 32px 0 ${hexToRgba(
                          colors.tertiary,
                          0.15,
                        )}, 0 0 0 1px rgba(255,255,255,0.1) inset`;
                      }}
                    >
                      {/* Gradient overlay */}
                      <div
                        className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-500"
                        style={{
                          background: `linear-gradient(135deg, ${hexToRgba(
                            colors.tertiary,
                            0.12,
                          )} 0%, ${hexToRgba(colors.primary, 0.08)} 100%)`,
                        }}
                      />

                      {/* Subtle glow */}
                      <div
                        className="absolute inset-0 rounded-2xl pointer-events-none blur-xl transition-all duration-500"
                        style={{
                          background: `radial-gradient(circle at center, ${hexToRgba(
                            colors.tertiary,
                            0.2,
                          )} 0%, transparent 70%)`,
                        }}
                      />

                      {/* Inner highlight */}
                      <div
                        className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-500"
                        style={{
                          background: `linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, transparent 100%)`,
                        }}
                      />

                      <div className="relative z-10">
                        <div className="text-center mb-6 sm:mb-8">
                          <div className="mb-4 sm:mb-6 flex justify-center">
                            <div
                              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center backdrop-blur-md"
                              style={{
                                background: `linear-gradient(135deg, ${hexToRgba(
                                  colors.tertiary,
                                  0.2,
                                )} 0%, ${hexToRgba(
                                  colors.primary,
                                  0.15,
                                )} 100%)`,
                                border: `1px solid ${hexToRgba(
                                  colors.tertiary,
                                  0.3,
                                )}`,
                              }}
                            >
                              <ChartBarIcon
                                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
                                style={{ color: colors.primary }}
                              />
                            </div>
                          </div>
                          <h2
                            className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3"
                            style={{
                              color: colors.primary,
                            }}
                          >
                            Build Your Trading History
                          </h2>
                          <p
                            className="text-base sm:text-lg mb-2"
                            style={{
                              color: colors.primary,
                              opacity: 0.8,
                            }}
                          >
                            We need at least 5 trades to analyse your mental
                            state
                          </p>
                          <p
                            className="text-xs sm:text-sm mb-4 sm:mb-6"
                            style={{
                              color: colors.primary,
                              opacity: 0.6,
                            }}
                          >
                            You currently have {totalTrades}{" "}
                            {totalTrades === 1 ? "trade" : "trades"}.
                            {totalTrades < 5 &&
                              ` ${5 - totalTrades} more ${5 - totalTrades === 1 ? "trade" : "trades"
                              } needed.`}
                          </p>
                          <Link href="/dashboard/trades">
                            <GlassmorphicButton
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-6 py-3 mx-auto"
                            >
                              Start Logging Trades
                            </GlassmorphicButton>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4 sm:space-y-6">
                {/* Performance Metrics */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="p-4 sm:p-6 rounded-2xl transition-all duration-300 relative"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
                    backdropFilter: "blur(20px) saturate(180%)",
                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    boxShadow:
                      "inset 0 1px 0 0 rgba(255, 255, 255, 0.1), 0 8px 32px 0 rgba(0, 0, 0, 0.08)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)";
                    e.currentTarget.style.border =
                      "1px solid rgba(255, 255, 255, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)";
                    e.currentTarget.style.border =
                      "1px solid rgba(255, 255, 255, 0.15)";
                  }}
                >
                  <div className="relative z-10">
                    <h3 className="text-lg sm:text-xl font-semibold text-primary mb-3 sm:mb-4 flex items-center gap-2">
                      <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-tertiary" />
                      Performance Metrics
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-primary/70">
                          Win Rate
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-primary">
                          {metrics.winRate}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-primary/70">
                          Avg Trade
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-primary">
                          {metrics.avgTrade}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-primary/70">
                          Risk/Reward
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-primary">
                          {metrics.riskReward}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-primary/70">
                          Trades Today
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-primary">
                          {metrics.tradesToday}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-primary/70">
                          Plan Compliance
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-primary">
                          {metrics.planCompliance}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-primary/70">
                          Early Exit Rate
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-primary">
                          {metrics.earlyExitRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Recommendations */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="p-4 sm:p-6 rounded-2xl transition-all duration-300 relative"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
                    backdropFilter: "blur(20px) saturate(180%)",
                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    boxShadow:
                      "inset 0 1px 0 0 rgba(255, 255, 255, 0.1), 0 8px 32px 0 rgba(0, 0, 0, 0.08)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)";
                    e.currentTarget.style.border =
                      "1px solid rgba(255, 255, 255, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)";
                    e.currentTarget.style.border =
                      "1px solid rgba(255, 255, 255, 0.15)";
                  }}
                >
                  <div className="relative z-10">
                    <h3 className="text-lg sm:text-xl font-semibold text-primary mb-3 sm:mb-4 flex items-center gap-2">
                      <ArrowTrendingUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-tertiary" />
                      Recommendations
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {currentStateData.recommendations.map((rec, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg backdrop-blur-sm"
                          style={{
                            background: "rgba(255, 255, 255, 0.1)",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                          }}
                        >
                          <div
                            className={`w-2 h-2 bg-gradient-to-r ${currentStateData.color} rounded-full mt-1.5 sm:mt-2 flex-shrink-0`}
                          />
                          <span className="text-xs sm:text-sm text-primary/90">
                            {rec}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="p-4 sm:p-6 rounded-2xl transition-all duration-300 relative"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
                    backdropFilter: "blur(20px) saturate(180%)",
                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    boxShadow:
                      "inset 0 1px 0 0 rgba(255, 255, 255, 0.1), 0 8px 32px 0 rgba(0, 0, 0, 0.08)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)";
                    e.currentTarget.style.border =
                      "1px solid rgba(255, 255, 255, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)";
                    e.currentTarget.style.border =
                      "1px solid rgba(255, 255, 255, 0.15)";
                  }}
                >
                  <div className="relative z-10">
                    <h3 className="text-lg sm:text-xl font-semibold text-primary mb-3 sm:mb-4 flex items-center gap-2">
                      <BoltIcon className="w-4 h-4 sm:w-5 sm:h-5 text-tertiary" />
                      Quick Actions
                    </h3>
                    <div className="space-y-2 sm:space-y-3 flex flex-col items-center">
                      <Link
                        href="/dashboard/trades"
                        className="w-full flex justify-center"
                      >
                        <GlassmorphicButton
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full p-2.5 sm:p-3 justify-center text-sm sm:text-base"
                        >
                          Log New Trade
                        </GlassmorphicButton>
                      </Link>
                      <motion.button
                        onClick={handleOpenPreferences}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full p-2.5 sm:p-3 text-primary rounded-lg text-sm sm:text-base font-medium transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-md"
                        style={{
                          background: "rgba(255, 255, 255, 0.15)",
                          border: "1px solid rgba(255, 255, 255, 0.25)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(255, 255, 255, 0.25)";
                          e.currentTarget.style.border =
                            "1px solid rgba(255, 255, 255, 0.35)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            "rgba(255, 255, 255, 0.15)";
                          e.currentTarget.style.border =
                            "1px solid rgba(255, 255, 255, 0.25)";
                        }}
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Set Preferences
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
