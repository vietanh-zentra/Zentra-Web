"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronDownIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

import CardIconTooltip from "./CardIconTooltip";

const PILLAR_ORDER_TOP_TO_BOTTOM = [
  { key: "tradeCount", name: "Trade Count Discipline" },
  { key: "session", name: "Session Time Adherence" },
  { key: "stopLoss", name: "Stop Loss Compliance" },
  { key: "riskReward", name: "Risk:Reward Compliance" },
  { key: "execution", name: "Execution Consistency" },
];

const PILLAR_WEIGHTS = {
  stopLoss: 0.25,
  tradeCount: 0.2,
  session: 0.2,
  riskReward: 0.2,
  execution: 0.15,
};

const DOT_COLORS = {
  Passed: "#00BFA6",
  Partial: "#F59E0B",
  Failed: "#EF4444",
  "No Data": "#E5E7EB",
};

function toLocalDateKey(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dotStatusToScore(status) {
  if (status === "Passed") return 100;
  if (status === "Partial") return 50;
  if (status === "Failed") return 0;
  return 0; // No Data => no compliance points
}

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function computeExecutionConsistency(tradesForDay, planRisk) {
  const risks = tradesForDay
    .map((t) => safeNumber(t.riskPercentUsed))
    .filter((n) => n !== null);

  if (risks.length === 0) {
    return {
      status: "No Data",
      reason: "riskPercentUsed missing for all trades",
    };
  }

  // Standard deviation around the baseline plan risk.
  const mean = risks.reduce((a, b) => a + b, 0) / risks.length;
  const variance = risks.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / risks.length;
  const stddev = Math.sqrt(variance);

  // Convert deviation into a relative number (so it scales with the plan baseline).
  const baseline = planRisk ?? mean;
  const rel = baseline !== 0 ? stddev / baseline : stddev;

  if (rel <= 0.05) {
    return {
      status: "Passed",
      reason: `Risk stable (deviation ${(rel * 100).toFixed(1)}%)`,
    };
  }
  if (rel <= 0.1) {
    return {
      status: "Partial",
      reason: `Risk moderately variable (deviation ${(rel * 100).toFixed(1)}%)`,
    };
  }

  return {
    status: "Failed",
    reason: `Risk inconsistent (deviation ${(rel * 100).toFixed(1)}%)`,
  };
}

function computeRiskReward(tradesForDay, tradingPlan) {
  if (!tradingPlan) {
    return {
      status: "No Data",
      reason: "Trading plan not available",
    };
  }

  const targetRR = safeNumber(tradingPlan.targetRiskRewardRatio);
  if (targetRR === null) {
    return {
      status: "No Data",
      reason: "Missing targetRiskRewardRatio",
    };
  }

  const missing = tradesForDay.filter((t) => {
    const rr = t.riskRewardAchieved;
    const tp = t.targetPercentAchieved;
    return (rr === null || rr === undefined) && (tp === null || tp === undefined);
  }).length;

  if (missing === tradesForDay.length) {
    return {
      status: "No Data",
      reason: `TP/RR data missing for all ${tradesForDay.length} trades`,
    };
  }

  if (missing > 0) {
    return {
      status: "Partial",
      reason: `TP/RR data missing for ${missing} of ${tradesForDay.length} trades`,
    };
  }

  const compliant = tradesForDay.filter((t) => {
    const rr = safeNumber(t.riskRewardAchieved);
    return rr !== null && rr >= targetRR;
  }).length;

  if (compliant === tradesForDay.length) {
    return {
      status: "Passed",
      reason: `All ${tradesForDay.length} trades achieved RR >= ${targetRR}`,
    };
  }
  if (compliant === 0) {
    return {
      status: "Failed",
      reason: `0 of ${tradesForDay.length} trades achieved RR >= ${targetRR}`,
    };
  }

  return {
    status: "Partial",
    reason: `${compliant} of ${tradesForDay.length} trades achieved RR >= ${targetRR}`,
  };
}

function computeStopLossCompliance(tradesForDay) {
  const lossTrades = tradesForDay.filter((t) => safeNumber(t.profitLoss) !== null && Number(t.profitLoss) < 0);

  if (lossTrades.length === 0) {
    return {
      status: "No Data",
      reason: "No losing trades on this day",
    };
  }

  const compliant = lossTrades.filter((t) => t.stopLossHit === true).length;

  if (compliant === lossTrades.length) {
    return {
      status: "Passed",
      reason: `${compliant} of ${lossTrades.length} losing trades closed by stop loss`,
    };
  }
  if (compliant === 0) {
    return {
      status: "Failed",
      reason: `0 of ${lossTrades.length} losing trades closed by stop loss`,
    };
  }

  return {
    status: "Partial",
    reason: `${compliant} of ${lossTrades.length} losing trades closed by stop loss`,
  };
}

function computeSessionAdherence(tradesForDay, tradingPlan) {
  if (!tradingPlan) {
    return { status: "No Data", reason: "Trading plan not available" };
  }

  const preferredSessions = Array.isArray(tradingPlan.preferredSessions)
    ? tradingPlan.preferredSessions
    : [];

  if (preferredSessions.length === 0) {
    return {
      status: "Passed",
      reason: `No session restrictions (all ${tradesForDay.length} trades accepted)`,
    };
  }

  const within = tradesForDay.filter((t) =>
    preferredSessions.includes(t.session)
  ).length;

  if (within === tradesForDay.length) {
    return {
      status: "Passed",
      reason: `All ${tradesForDay.length} trades were within allowed session(s)`,
    };
  }
  if (within === 0) {
    return {
      status: "Failed",
      reason: `0 of ${tradesForDay.length} trades were within allowed session(s)`,
    };
  }

  return {
    status: "Partial",
    reason: `${within} of ${tradesForDay.length} trades were within allowed session(s)`,
  };
}

function computeTradeCountDiscipline(tradesForDay, tradingPlan) {
  if (!tradingPlan) {
    return { status: "No Data", reason: "Trading plan not available" };
  }

  const maxTradesPerDay = tradingPlan.maxTradesPerDay;
  if (typeof maxTradesPerDay !== "number") {
    return { status: "No Data", reason: "Missing maxTradesPerDay" };
  }

  const total = tradesForDay.length;

  if (total <= maxTradesPerDay) {
    return {
      status: "Passed",
      reason: `${total} trades vs allowed max ${maxTradesPerDay}`,
    };
  }

  if (total === maxTradesPerDay + 1) {
    return {
      status: "Partial",
      reason: `${total} trades vs allowed max ${maxTradesPerDay} (exceeded by 1)`,
    };
  }

  return {
    status: "Failed",
    reason: `${total} trades vs allowed max ${maxTradesPerDay} (exceeded)`,
  };
}

export default function PlanControlCard({
  selectedDate,
  trades = [],
  tradingPlan = null,
}) {
  const [showHelperHint, setShowHelperHint] = useState(false);

  useEffect(() => {
    console.log("PLAN CONTROL DATE:", selectedDate);
    console.log("PLAN DATA:", trades);
  }, [selectedDate, trades]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = window.localStorage.getItem("planControlHelperDismissed");
    if (!dismissed) setShowHelperHint(true);
  }, []);

  const dismissHelper = () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("planControlHelperDismissed", "1");
    setShowHelperHint(false);
  };

  const computed = useMemo(() => {
    const weekLabels = ["S", "M", "T", "W", "T", "F", "S"];
    const base = selectedDate ? new Date(selectedDate) : new Date();
    base.setHours(0, 0, 0, 0);

    // Sunday-based week to match the UI label ordering.
    const startOfWeek = new Date(base);
    startOfWeek.setDate(base.getDate() - base.getDay());

    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const tradeByDayKey = new Map();
    (trades || []).forEach((t) => {
      const entryTime = t?.entryTime;
      if (!entryTime) return;
      const k = toLocalDateKey(new Date(entryTime));
      if (!tradeByDayKey.has(k)) tradeByDayKey.set(k, []);
      tradeByDayKey.get(k).push(t);
    });

    const selectedDayKey = toLocalDateKey(base);
    const selectedDayTrades = tradeByDayKey.get(selectedDayKey) || [];
    const selectedDayEmpty = selectedDayTrades.length === 0;

    const pillarStatusesByDay = weekDates.map((d) => {
      const dayKey = toLocalDateKey(d);
      const dayTrades = tradeByDayKey.get(dayKey) || [];

      if (selectedDayEmpty) {
        // Step 7: if no trades for selected date -> all dots are No Data
        return {
          tradeCount: { status: "No Data", reason: "No data available for this date" },
          session: { status: "No Data", reason: "No data available for this date" },
          stopLoss: { status: "No Data", reason: "No data available for this date" },
          riskReward: { status: "No Data", reason: "No data available for this date" },
          execution: { status: "No Data", reason: "No data available for this date" },
        };
      }

      if (dayTrades.length === 0) {
        return {
          tradeCount: { status: "No Data", reason: "No trades for this day" },
          session: { status: "No Data", reason: "No trades for this day" },
          stopLoss: { status: "No Data", reason: "No trades for this day" },
          riskReward: { status: "No Data", reason: "No trades for this day" },
          execution: { status: "No Data", reason: "No trades for this day" },
        };
      }

      const maxTrades = computeTradeCountDiscipline(dayTrades, tradingPlan);
      const session = computeSessionAdherence(dayTrades, tradingPlan);
      const stopLoss = computeStopLossCompliance(dayTrades);
      const riskReward = computeRiskReward(dayTrades, tradingPlan);

      const planRisk = tradingPlan ? safeNumber(tradingPlan.riskPercentPerTrade) : null;
      const execution = computeExecutionConsistency(dayTrades, planRisk);

      return {
        tradeCount: maxTrades,
        session,
        stopLoss,
        riskReward,
        execution,
      };
    });

    const selectedIndex = weekDates.findIndex(
      (d) => toLocalDateKey(d) === selectedDayKey
    );
    const selectedPillars = pillarStatusesByDay[selectedIndex] || null;

    const overallScore = selectedDayEmpty
      ? 0
      : Math.round(
          (dotStatusToScore(selectedPillars.tradeCount.status) * PILLAR_WEIGHTS.tradeCount +
            dotStatusToScore(selectedPillars.session.status) * PILLAR_WEIGHTS.session +
            dotStatusToScore(selectedPillars.stopLoss.status) * PILLAR_WEIGHTS.stopLoss +
            dotStatusToScore(selectedPillars.riskReward.status) * PILLAR_WEIGHTS.riskReward +
            dotStatusToScore(selectedPillars.execution.status) * PILLAR_WEIGHTS.execution) *
            1
        );

    return {
      selectedDayEmpty,
      overallScore,
      dayLabels: weekLabels,
      pillarStatusesByDay,
    };
  }, [selectedDate, trades, tradingPlan]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative flex flex-col p-6 overflow-visible border border-[#fff] shadow-sm group/plan"
      style={{
        borderRadius: "20px",
        backgroundColor: "#E8F2F3",
        borderColor: "#FFFFFF",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-[#363636]">Plan Control</h3>

        <div className="flex items-center gap-2">
          {/* <div className="relative flex items-center gap-2 bg-[#F2F7F7] px-3 py-3 rounded-full text-xs font-normal text-[#363636] border border-[#FFFFFF] transition-colors hover:bg-[#EEF6F6]">
            <select
              defaultValue="Today"
              className="appearance-none bg-transparent pr-6 text-xs text-[#363636] font-normal leading-none outline-none"
            >
              <option value="Today">Today</option>
              <option value="1w">1 Week</option>
              <option value="2w">2 Weeks</option>
              <option value="1m">1 Month</option>
            </select>
            <ChevronDownIcon
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#363636]"
              aria-hidden="true"
            />
          </div> */}

          {/* Info popover */}
          <CardIconTooltip
            title="How Plan Control Works"
            tooltipText="Plan Control measures how closely you follow your onboarding trading plan. Each day has 5 checks (pillars). Dot colors show Passed / Partial / Failed / No Data. Score is overall compliance %."
            position="top"
          >
            <div className="w-10 h-10 rounded-full bg-[#F2F7F7] border border-[#FFFFFF] flex items-center justify-center shadow-sm cursor-help">
              <InformationCircleIcon className="w-5 h-5 text-[#363636]" />
            </div>
          </CardIconTooltip>
        </div>
      </div>

      {/* Main Stats */}
      <div className="flex items-center gap-3 mt-2">
        <div className="text-[32px] font-medium text-[#363636] tracking-tight">
          {computed.selectedDayEmpty ? 0 : computed.overallScore}%
        </div>
      </div>

      {/* Empty data message + optional helper hint */}
      <div className="mt-2">
        {computed.selectedDayEmpty ? (
          <p className="text-sm text-gray-500 text-center">
            No data available for this date
          </p>
        ) : showHelperHint ? (
          <div className="flex items-center justify-between gap-3 mt-2">
            <p className="text-[12px] text-gray-600 leading-tight">
              Plan Control tracks 5 parts of your trading plan. Hover dots to see details.
            </p>
            <button
              type="button"
              onClick={dismissHelper}
              className="text-[12px] font-medium text-[#363636] px-3 py-1 rounded-full bg-white/60 border border-white/60 hover:bg-white"
            >
              Got it
            </button>
          </div>
        ) : null}
      </div>

      {/* Dot Chart */}
      <div className="flex justify-between items-end mt-4">
        {computed.dayLabels.map((day, dayIndex) => {
          const pillarStatuses = computed.pillarStatusesByDay[dayIndex];

          return (
            <div key={dayIndex} className="flex flex-col items-center gap-3">
              <div className="flex flex-col gap-1.5">
                {PILLAR_ORDER_TOP_TO_BOTTOM.map((pillar) => {
                  const pillarState = pillarStatuses?.[pillar.key];
                  const status = pillarState?.status || "No Data";
                  const reason = pillarState?.reason || "No data";

                  const tooltipText = `${day} - ${pillar.name} | Status: ${status} | ${reason}`;
                  const bg = DOT_COLORS[status] || DOT_COLORS["No Data"];

                  return (
                    <CardIconTooltip
                      key={pillar.key}
                      tooltipText={tooltipText}
                      title={pillar.name}
                      position="top"
                    >
                      <div
                        className="w-3 h-3 rounded-full transition-colors duration-300"
                        style={{
                          backgroundColor: bg,
                          opacity: status === "No Data" ? 0.8 : 1,
                        }}
                        title={tooltipText}
                        aria-label={tooltipText}
                      />
                    </CardIconTooltip>
                  );
                })}
              </div>

              <span className="text-xs font-medium text-gray-500">{day}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

