"use client";
import { motion } from "framer-motion";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo } from "react";
import CardIconTooltip from "./CardIconTooltip";

const DEFAULT_CATEGORIES = [
  "Impulsiveness",
  "Consistency",
  "Discipline",
  "Aggression",
  "Hesitation",
];

const TRAIT_COLORS = {
  Impulsiveness: "#F59E0B",
  Consistency: "#00BFA6",
  Discipline: "#2563EB",
  Aggression: "#EF4444",
  Hesitation: "#6B7280",
};

const KEY_MAPPING = {
  impulseControl: "Impulsiveness",
  emotionalVolatility: "Emotional Volatility",
  aggression: "Aggression",
  hesitation: "Hesitation",
  discipline: "Discipline",
  consistency: "Consistency",
  Impulsiveness: "Impulsiveness",
  Consistency: "Consistency",
  Discipline: "Discipline",
  Aggression: "Aggression",
  Hesitation: "Hesitation",
};

const TRAITS_CONFIG = {
  rollWindowSize: 5, // last N trades used for "current" signal
  smoothing: { previousWeight: 0.7, currentWeight: 0.3 }, // exponential smoothing across overlapping windows
  maxPerUpdateChange: 10, // cap change to avoid extreme jumps
  timing: {
    rapidReentryMinutes: 30,
    burstMinutes: 60,
  },
  sizing: {
    spikePct: 0.2, // lot/risk spike threshold vs baseline risk
  },
  neutral: {
    missingRisk: 50,
    missingRR: 50,
    missingLossEval: 50, // neutral for SL usage if no losing trades exist in window
  },
  hesitation: {
    smallProfitQuantile: 0.33, // low-profit tail inside window
    breakevenEpsilonPctOfMedianAbs: 0.1,
    breakevenDurationPctOfMedianDuration: 0.5,
  },
};

function toLocalDateKey(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function clampScore(v) {
  return Math.max(0, Math.min(100, v));
}

function median(values) {
  if (!values || values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

function stdDev(values) {
  if (!values || values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function normalizeFromCv(cv, scale = 0.5) {
  // cv=0 => 1, cv>=scale => 0
  const t = scale === 0 ? 0 : cv / scale;
  return clampScore((1 - Math.max(0, Math.min(1, t))) * 100);
}

function pickSmallProfitThreshold(tradesAsc, config) {
  const positives = tradesAsc
    .map((t) => t?.profitLoss)
    .filter((v) => typeof v === "number" && v > 0);
  if (positives.length === 0) return null;
  const sorted = [...positives].sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * config.smallProfitQuantile);
  const safeIdx = Math.max(0, Math.min(sorted.length - 1, idx));
  return sorted[safeIdx];
}

function getDurationMinutes(trade) {
  if (!trade?.entryTime || !trade?.exitTime) return null;
  const ms = new Date(trade.exitTime) - new Date(trade.entryTime);
  if (!Number.isFinite(ms)) return null;
  return ms / (1000 * 60);
}

function buildExplainability(reasons) {
  // Keep reasons short and ordered by "signal strongest first" (already provided by caller).
  return reasons.filter(Boolean).slice(0, 3);
}

function computeTraitSignals(tradesAsc, prevWindowAsc, tradingPlan) {
  // tradesAsc: current window (ascending by entryTime), prevWindowAsc: previous overlapping window
  const tradeCount = tradesAsc.length;
  const preferredSessions = Array.isArray(tradingPlan?.preferredSessions)
    ? tradingPlan.preferredSessions
    : [];
  const maxTradesPerDay = typeof tradingPlan?.maxTradesPerDay === "number" ? tradingPlan.maxTradesPerDay : null;
  const targetRR = typeof tradingPlan?.targetRiskRewardRatio === "number" ? tradingPlan.targetRiskRewardRatio : null;

  const losses = tradesAsc.filter((t) => typeof t.profitLoss === "number" && t.profitLoss < 0);
  const lossCount = losses.length;

  const intervals = [];
  for (let i = 1; i < tradesAsc.length; i++) {
    const prevExit = tradesAsc[i - 1]?.exitTime ? new Date(tradesAsc[i - 1].exitTime) : null;
    const currEntry = tradesAsc[i]?.entryTime ? new Date(tradesAsc[i].entryTime) : null;
    if (!prevExit || !currEntry) continue;
    const diffMin = (currEntry - prevExit) / (1000 * 60);
    if (Number.isFinite(diffMin)) intervals.push(diffMin);
  }

  // --- Common rates ---
  const preferredSessionEnabled = preferredSessions.length > 0;
  const offSessionCount = preferredSessionEnabled
    ? tradesAsc.filter((t) => !preferredSessions.includes(t.session)).length
    : 0;

  const rapidReentryAfterLossCount = (() => {
    if (tradesAsc.length < 2) return 0;
    let count = 0;
    for (let i = 1; i < tradesAsc.length; i++) {
      const prev = tradesAsc[i - 1];
      const curr = tradesAsc[i];
      const prevExit = prev?.exitTime ? new Date(prev.exitTime) : null;
      const currEntry = curr?.entryTime ? new Date(curr.entryTime) : null;
      if (!prevExit || !currEntry) continue;
      const diffMin = (currEntry - prevExit) / (1000 * 60);
      if (diffMin >= 0 && diffMin < TRAITS_CONFIG.timing.rapidReentryMinutes && prev?.profitLoss < 0) {
        count++;
      }
    }
    return count;
  })();

  const clusteredIntervalsCount = intervals.filter(
    (diffMin) => diffMin >= 0 && diffMin <= TRAITS_CONFIG.timing.burstMinutes
  ).length;

  // Baseline risk comes from the previous window when possible.
  const prevRisks = prevWindowAsc
    .map((t) => (typeof t.riskPercentUsed === "number" ? t.riskPercentUsed : null))
    .filter((n) => n !== null);
  const currRisks = tradesAsc
    .map((t) => (typeof t.riskPercentUsed === "number" ? t.riskPercentUsed : null))
    .filter((n) => n !== null);

  const baselineRisk =
    prevRisks.length > 0 ? prevRisks.reduce((a, b) => a + b, 0) / prevRisks.length : (currRisks.length > 0 ? currRisks.reduce((a, b) => a + b, 0) / currRisks.length : null);

  const spikeCount = baselineRisk !== null
    ? tradesAsc.filter((t) => typeof t.riskPercentUsed === "number" && t.riskPercentUsed >= baselineRisk * (1 + TRAITS_CONFIG.sizing.spikePct)).length
    : 0;

  const rapidDenom = Math.max(1, tradeCount - 1);
  const offSessionRate = tradeCount > 0 ? offSessionCount / tradeCount : 0;
  const rapidRate = rapidReentryAfterLossCount / rapidDenom;
  const clusterRate = intervals.length > 0 ? clusteredIntervalsCount / intervals.length : 0;
  const spikeRate = tradeCount > 0 ? spikeCount / tradeCount : 0;

  // --- IMPULSIVENESS ---
  const impulsivenessSignal = clampScore(
    100 *
      (0.28 * offSessionRate +
        0.30 * rapidRate +
        0.22 * spikeRate +
        0.20 * clusterRate)
  );
  const impulsivenessReasons = buildExplainability([
    offSessionCount > 0 ? `${offSessionCount} off-session trade(s)` : null,
    rapidReentryAfterLossCount > 0 ? `${rapidReentryAfterLossCount} rapid re-entr${rapidReentryAfterLossCount === 1 ? "y" : "ies"} after loss` : null,
    spikeCount > 0 ? `${spikeCount} lot size/risk spike(s)` : null,
    clusteredIntervalsCount > 0 ? `${clusteredIntervalsCount} clustered entr${clusteredIntervalsCount === 1 ? "y" : "ies"} in short time` : null,
    tradeCount > 1 ? (impulsivenessSignal < 35 ? "Pacing appears controlled in this window" : null) : null,
  ]);

  // --- CONSISTENCY ---
  const riskValues = currRisks;
  const riskMean = riskValues.length > 0 ? riskValues.reduce((a, b) => a + b, 0) / riskValues.length : null;
  const riskStd = riskValues.length >= 2 ? stdDev(riskValues) : 0;
  const riskCv = riskMean && riskMean !== 0 ? riskStd / Math.abs(riskMean) : null;
  const riskStabilityScore =
    riskCv === null ? TRAITS_CONFIG.neutral.missingRisk : normalizeFromCv(riskCv, 0.6);

  const sessionCounts = tradesAsc.reduce((acc, t) => {
    acc[t?.session] = (acc[t?.session] || 0) + 1;
    return acc;
  }, {});
  const modeSessionCount = Object.values(sessionCounts).reduce((m, v) => Math.max(m, v), 0);
  const sessionRegularityRate = tradeCount > 0 ? (preferredSessionEnabled ? offSessionCount === 0 ? 1 : (tradeCount - offSessionCount) / tradeCount : modeSessionCount / tradeCount) : 0;
  const sessionRegularityScore = clampScore(sessionRegularityRate * 100);

  const intervalMean = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : null;
  const intervalStd = intervals.length >= 2 ? stdDev(intervals) : 0;
  const intervalCv = intervalMean && intervalMean !== 0 ? intervalStd / Math.abs(intervalMean) : null;
  const timingConsistencyScore =
    intervalCv === null ? TRAITS_CONFIG.neutral.missingRisk : normalizeFromCv(intervalCv, 1);

  const consistencySignal = clampScore(
    0.52 * riskStabilityScore +
      0.28 * sessionRegularityScore +
      0.20 * timingConsistencyScore
  );

  const consistencyReasons = buildExplainability([
    riskCv === null ? "Risk sizing data insufficient for stability" : riskCv !== null && riskCv < 0.25 ? "Stable risk sizing in this window" : null,
    preferredSessionEnabled ? (offSessionCount === 0 ? "All trades within preferred sessions" : `${offSessionCount} off-session trade(s)` ) : (modeSessionCount >= Math.ceil(tradeCount * 0.6) ? "Consistent session pattern" : null),
    intervalCv !== null && intervalCv < 0.4 ? "Timing between trades is steady" : null,
  ]);

  // --- DISCIPLINE ---
  // SL usage proxy: on losing trades, whether stopLossHit is true.
  const slUsageRate = lossCount > 0
    ? losses.filter((t) => t.stopLossHit === true).length / lossCount
    : null;
  const slScore = slUsageRate === null ? TRAITS_CONFIG.neutral.missingLossEval : clampScore(slUsageRate * 100);

  const sessionScore = preferredSessionEnabled
    ? clampScore(((tradeCount - offSessionCount) / tradeCount) * 100)
    : 100;

  const tradeLimitScore = (() => {
    if (typeof maxTradesPerDay !== "number") return 50; // neutral when limit isn't available
    if (tradeCount <= maxTradesPerDay) return 100;
    if (tradeCount === maxTradesPerDay + 1) return 70;
    return 30;
  })();

  const rrScore = (() => {
    if (targetRR === null) return TRAITS_CONFIG.neutral.missingRR;
    const rrTrades = tradesAsc.filter((t) => typeof t.riskRewardAchieved === "number");
    if (rrTrades.length === 0) return TRAITS_CONFIG.neutral.missingRR;
    const compliant = rrTrades.filter((t) => t.riskRewardAchieved >= targetRR).length;
    return clampScore((compliant / rrTrades.length) * 100);
  })();

  const disciplineSignal = clampScore(
    0.34 * sessionScore +
      0.26 * tradeLimitScore +
      0.20 * rrScore +
      0.20 * slScore
  );

  const disciplineReasons = buildExplainability([
    lossCount > 0 ? (slUsageRate === 1 ? `SL hit on all ${lossCount} losing trade(s)` : slUsageRate !== null && slUsageRate < 0.5 ? `SL missing on ${losses.filter((t) => t.stopLossHit === false).length} losing trade(s)` : `Mixed SL usage on losing trades`) : `No losing trades in this window (SL usage neutral)`,
    preferredSessionEnabled ? (offSessionCount === 0 ? "All trades in preferred sessions" : `${offSessionCount} off-session trade(s)`) : null,
    targetRR !== null ? (rrScore === 100 ? "All RR-compliant outcomes" : rrScore < 50 ? "RR compliance is weak in this window" : null) : null,
    typeof maxTradesPerDay === "number" ? (tradeCount <= maxTradesPerDay ? "Trade count within limit" : `Overtrading vs max (${tradeCount}/${maxTradesPerDay})`) : null,
  ]);

  // --- AGGRESSION (neutral framing) ---
  const riskIncreaseDenom = Math.max(1, tradeCount);
  const riskIncreaseRate = baselineRisk === null ? 0 : spikeCount / riskIncreaseDenom;

  const burstDenom = Math.max(1, tradeCount - 1);
  const burstRate = burstDenom > 0 ? clusteredIntervalsCount / burstDenom : 0;

  // Baseline aggression around 50; it increases as risk spikes and burstiness increases.
  const aggressionSignal = clampScore(50 + 50 * (0.58 * riskIncreaseRate + 0.42 * burstRate));

  const aggressionReasons = buildExplainability([
    baselineRisk === null ? "Not enough risk sizing data for aggression signal" : riskIncreaseRate > 0.2 ? `${spikeCount} risk spike(s) vs baseline` : null,
    burstRate > 0.3 ? `${clusteredIntervalsCount} rapid entries in short time` : null,
    burstRate <= 0.15 && riskIncreaseRate <= 0.05 ? "Execution intensity looks controlled" : null,
  ]);

  // --- HESITATION ---
  const earlyCloseCount = tradesAsc.filter((t) => t.exitedEarly === true).length;
  const earlyCloseRate = tradeCount > 0 ? earlyCloseCount / tradeCount : 0;

  const smallProfitThreshold = pickSmallProfitThreshold(tradesAsc, TRAITS_CONFIG.hesitation);
  const smallProfitCount = smallProfitThreshold === null
    ? 0
    : tradesAsc.filter((t) => typeof t.profitLoss === "number" && t.profitLoss > 0 && t.profitLoss <= smallProfitThreshold).length;
  const smallProfitRate = tradeCount > 0 ? smallProfitCount / tradeCount : 0;

  const durations = tradesAsc.map(getDurationMinutes).filter((v) => v !== null);
  const medianDuration = median(durations);

  const absProfits = tradesAsc.map((t) => (typeof t.profitLoss === "number" ? Math.abs(t.profitLoss) : null)).filter((v) => v !== null);
  const medianAbsProfit = median(absProfits);
  const breakevenEps = medianAbsProfit === null ? null : medianAbsProfit * TRAITS_CONFIG.hesitation.breakevenEpsilonPctOfMedianAbs;

  const breakevenSoonCount = (() => {
    if (breakevenEps === null || medianDuration === null || medianDuration === 0) return 0;
    const maxBreakevenDuration = medianDuration * TRAITS_CONFIG.hesitation.breakevenDurationPctOfMedianDuration;
    return tradesAsc.filter((t) => {
      const abs = typeof t.profitLoss === "number" ? Math.abs(t.profitLoss) : null;
      if (abs === null || abs > breakevenEps) return false;
      const dur = getDurationMinutes(t);
      if (dur === null) return false;
      return dur <= maxBreakevenDuration;
    }).length;
  })();
  const breakevenSoonRate = tradeCount > 0 ? breakevenSoonCount / tradeCount : 0;

  const durationMean = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null;
  const durationStd = durations.length >= 2 ? stdDev(durations) : 0;
  const durationCv = durationMean && durationMean !== 0 ? durationStd / Math.abs(durationMean) : null;
  const timingInconsistencyScore =
    durationCv === null ? TRAITS_CONFIG.neutral.missingRisk : normalizeFromCv(durationCv, 0.7);

  const hesitationSignal = clampScore(
    100 * (0.36 * earlyCloseRate + 0.24 * smallProfitRate + 0.20 * breakevenSoonRate + 0.20 * (timingInconsistencyScore / 100))
  );

  const hesitationReasons = buildExplainability([
    earlyCloseCount > 0 ? `${earlyCloseCount} early close(s) before TP` : null,
    smallProfitCount > 0 ? `${smallProfitCount} small-profit exit(s)` : null,
    breakevenSoonCount > 0 ? `${breakevenSoonCount} quick breakeven exits` : null,
    timingInconsistencyScore > 60 ? "Inconsistent execution timing/durations" : null,
  ]);

  return {
    Impulsiveness: { signal: impulsivenessSignal, reasons: impulsivenessReasons },
    Consistency: { signal: consistencySignal, reasons: consistencyReasons },
    Discipline: { signal: disciplineSignal, reasons: disciplineReasons },
    Aggression: { signal: aggressionSignal, reasons: aggressionReasons },
    Hesitation: { signal: hesitationSignal, reasons: hesitationReasons },
  };
}

function smoothValue(prevValue, currentValue) {
  const prev = typeof prevValue === "number" ? prevValue : currentValue;
  const nextRaw = prev * TRAITS_CONFIG.smoothing.previousWeight + currentValue * TRAITS_CONFIG.smoothing.currentWeight;
  const delta = nextRaw - prev;
  let capped = nextRaw;
  if (Math.abs(delta) > TRAITS_CONFIG.maxPerUpdateChange) {
    capped = prev + Math.sign(delta) * TRAITS_CONFIG.maxPerUpdateChange;
  }
  return clampScore(Math.round(capped));
}

export default function PsychologicalStateDistribution({
  data = null,
  hasNoTrades = false,
  selectedDate = null,
  trades = [],
  tradingPlan = null,
  behaviorData = null,
}) {
  const selectedDayKey = useMemo(() => {
    if (!selectedDate) return null;
    return toLocalDateKey(selectedDate);
  }, [selectedDate]);

  const traitsData = useMemo(() => {
    if (!selectedDayKey) return null;
    if (!Array.isArray(trades)) return null;

    const tradesForDay = trades.filter((t) => {
      const entryKey = t?.entryTime ? toLocalDateKey(new Date(t.entryTime)) : null;
      return entryKey && entryKey === selectedDayKey;
    });

    if (!tradesForDay || tradesForDay.length === 0) return null;

    // Current/previous overlapping windows (most recent trades first, then convert to ascending for timing checks)
    const tradesDesc = [...tradesForDay].sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime));
    const currentWindowDesc = tradesDesc.slice(0, TRAITS_CONFIG.rollWindowSize);
    const previousWindowDesc = tradesDesc.slice(1, 1 + TRAITS_CONFIG.rollWindowSize);
    const prevPrevWindowDesc = tradesDesc.slice(1 + TRAITS_CONFIG.rollWindowSize, 1 + 2 * TRAITS_CONFIG.rollWindowSize);

    const toAsc = (arr) => [...arr].sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime));
    const currentAsc = toAsc(currentWindowDesc);
    const previousAsc = toAsc(previousWindowDesc);
    const prevPrevAsc = toAsc(prevPrevWindowDesc);

    const currentSignals = computeTraitSignals(currentAsc, previousAsc, tradingPlan);
    const previousSignals =
      previousAsc.length > 0 ? computeTraitSignals(previousAsc, prevPrevAsc, tradingPlan) : currentSignals;

    const traits = {};
    for (const category of DEFAULT_CATEGORIES) {
      const curr = currentSignals[category]?.signal ?? 0;
      const prev = previousSignals[category]?.signal ?? curr;
      const value = smoothValue(prev, curr);
      const prevClamped = clampScore(Math.round(prev));
      const change = Math.round(value - prevClamped);
      const reasons = currentSignals[category]?.reasons || [];

      traits[category] = { value, change, reasons };
    }

    return traits;
  }, [selectedDayKey, trades, tradingPlan]);

  // If backend behavioral API data is available, map it to trait scores
  const apiTraitsData = useMemo(() => {
    if (!behaviorData || behaviorData.insufficient_data) return null;
    const revenge = behaviorData.revenge_trading;
    const earlyExits = behaviorData.early_exits;
    const overtrading = behaviorData.overtrading;
    const impulsive = behaviorData.impulsive_entries;
    const mb = behaviorData.mental_battery;

    if (!revenge && !earlyExits && !overtrading) return null;

    return {
      Impulsiveness: {
        value: clampScore(
          (impulsive?.rate || 0) * 100 * 0.5 +
          (revenge?.revenge_rate || 0) * 100 * 0.5
        ),
        change: null,
        reasons: [
          revenge?.count > 0 ? `${revenge.count} revenge trades` : null,
          impulsive?.cluster_count > 0 ? `${impulsive.cluster_count} rapid-fire clusters` : null,
        ].filter(Boolean),
      },
      Consistency: {
        value: clampScore(mb?.percentage || 50),
        change: null,
        reasons: mb?.factors?.filter(f => f.impact === 'positive').map(f => f.detail) || [],
      },
      Discipline: {
        value: clampScore(
          100 - (overtrading?.overtrading_days || 0) * 15 -
          (earlyExits?.rate || 0) * 50
        ),
        change: null,
        reasons: [
          overtrading?.detected ? `${overtrading.overtrading_days} overtrading days` : null,
          earlyExits?.count > 0 ? `${earlyExits.count} early exits` : null,
        ].filter(Boolean),
      },
      Aggression: {
        value: clampScore(50 + (overtrading?.excess_trades || 0) * 5),
        change: null,
        reasons: [
          overtrading?.peak_count ? `Peak: ${overtrading.peak_count} trades/day` : null,
        ].filter(Boolean),
      },
      Hesitation: {
        value: clampScore((earlyExits?.rate || 0) * 100),
        change: null,
        reasons: [
          earlyExits?.count > 0 ? `${earlyExits.count} early exits (${((earlyExits.rate || 0) * 100).toFixed(1)}%)` : null,
          earlyExits?.potential_missed_profit > 0 ? `$${earlyExits.potential_missed_profit.toFixed(0)} missed profit` : null,
        ].filter(Boolean),
      },
    };
  }, [behaviorData]);

  // Prefer API data over client-side computation
  const effectiveTraitsData = apiTraitsData || traitsData;
  const resolvedHasNoTrades = Boolean(hasNoTrades) || !effectiveTraitsData;

  useEffect(() => {
    console.log("TRAITS DATE:", selectedDate);
    console.log("TRADES:", trades);
    console.log("TRAITS OUTPUT:", traitsData);
  }, [selectedDate, trades, traitsData]);

  // If we don't have the trade-driven engine output yet, do not show mock values.
  // As a backwards-compatible fallback, use the passed `data` only if it contains real trait numbers.
  const fallbackSourceData = useMemo(() => {
    if (!resolvedHasNoTrades && data && typeof data === "object") return data;
    return null;
  }, [data, resolvedHasNoTrades]);

  const fallbackMappedValues = useMemo(() => {
    if (!fallbackSourceData || typeof fallbackSourceData !== "object") return null;
    const mapped = {};
    Object.entries(fallbackSourceData).forEach(([key, value]) => {
      const label = KEY_MAPPING[key] || key;
      if (DEFAULT_CATEGORIES.includes(label) && typeof value === "number") {
        mapped[label] = value;
      }
    });
    return Object.keys(mapped).length > 0 ? mapped : null;
  }, [fallbackSourceData]);

  let categories = DEFAULT_CATEGORIES;

  if (!resolvedHasNoTrades && fallbackSourceData && Object.keys(fallbackSourceData).length > 0) {
    categories = Object.keys(fallbackSourceData)
      .filter((key) => key !== "emotionalVolatility")
      .map((key) => KEY_MAPPING[key] || key)
      .filter((key) => DEFAULT_CATEGORIES.includes(key));
  }

  const formatLabel = (key) => {
    if (KEY_MAPPING[key]) return KEY_MAPPING[key];

    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="bg-[#E8F2F3] border border-[#FFFFFF] rounded-[20px] p-[20px] h-full flex flex-col relative"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative">
        <h3 className="text-[18px] font-[500] text-[#363636]">
          Psychological Traits
        </h3>

        <CardIconTooltip
          title="Psychological Traits"
          tooltipText="Breaks down your real-time psychological profile across traits. Gives a clear snapshot of which tendencies are currently driving your decisions."
        >
          <button className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F2F7F7] border border-[#FFFFFF] transition-colors ">
            <EllipsisHorizontalIcon className="w-6 h-6 text-gray-500 rotate-90" />
          </button>
        </CardIconTooltip>
      </div>

      {/* Progress Bars */}
      <div className="flex flex-col gap-2 flex-1 justify-center relative z-10">
        {categories.map((category, index) => {
          const rawValue = resolvedHasNoTrades
            ? 0
            : effectiveTraitsData?.[category]?.value ?? fallbackMappedValues?.[category] ?? 0;

          const value = Math.min(100, Math.max(0, rawValue));
          const change = effectiveTraitsData?.[category]?.change ?? null;
          const reasons = effectiveTraitsData?.[category]?.reasons ?? [];
          const tooltip = !resolvedHasNoTrades && effectiveTraitsData?.[category]
            ? `${category} ${value}% (${change !== null ? (change >= 0 ? "+" : "") + change : "~"}) | ${reasons.join(" • ")}`
            : null;

          return (
            <div key={category} className="flex items-center gap-3" title={tooltip || undefined}>
              <span className="w-28 text-[12px] font-medium text-gray-600">
                {formatLabel(category)}
              </span>

              <div className="flex-1 h-5 bg-[#F2F7F7] border border-white rounded-full overflow-hidden shadow-sm">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{
                    duration: 1,
                    delay: 0.2 + index * 0.1,
                    ease: "easeOut",
                  }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: TRAIT_COLORS[formatLabel(category)] || "#9CA3AF",
                  }}
                />
              </div>

              <span className="w-12 text-right text-[12px] font-[500] text-[#636363]">
                {value}%
              </span>
            </div>
          );
        })}
      </div>

      {/* No Trades Overlay */}
      {resolvedHasNoTrades && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px] z-20 rounded-[24px]">
          <div className="text-center bg-white/80 px-6 py-4 rounded-xl shadow-sm border border-white/50">
            <p className="text-sm font-medium text-gray-500">
              No data available for this date
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
