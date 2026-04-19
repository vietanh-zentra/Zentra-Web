'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { ChartBarIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

// -------------------- Stability Engine Config --------------------

const STABILITY_WEIGHTS = {
  planAdherence: 0.2,
  discipline: 0.2,
  consistency: 0.2,
  impulsivenessInverse: 0.15,
  aggressionBalance: 0.1,
  hesitationInverse: 0.1,
  lossReactionControl: 0.05,
};

// Thresholds configurable for future tuning.
const STABILITY_THRESHOLDS = {
  rapidReentryMinutes: 30,
  burstMinutes: 60,
  timingDisciplineMinutes: 30,
  riskSpikePct: 0.2,
  rrComplianceThresholdPercent: 80, // fallback when RR achieved is missing
  slWinNeutralScore: 50, // neutral when no losing trades exist (cannot infer SL usage quality)
  cvNormalizationScale: 0.6,
};

const clampScore = (v) => Math.max(0, Math.min(100, v));

const toLocalDateKey = (dateLike) => {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const median = (values) => {
  const arr = Array.isArray(values)
    ? values.filter((v) => typeof v === 'number' && Number.isFinite(v))
    : [];
  if (arr.length === 0) return null;
  arr.sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  if (arr.length % 2 === 0) return (arr[mid - 1] + arr[mid]) / 2;
  return arr[mid];
};

const stdDev = (values) => {
  const arr = Array.isArray(values)
    ? values.filter((v) => typeof v === 'number' && Number.isFinite(v))
    : [];
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
};

const normalizeFromCv = (cv, scale = STABILITY_THRESHOLDS.cvNormalizationScale) => {
  if (!Number.isFinite(cv) || cv < 0) return 0;
  // cv=0 => 1, cv>=scale => 0
  const t = scale === 0 ? 0 : cv / scale;
  return clampScore((1 - Math.max(0, Math.min(1, t))) * 100);
};

const pickQuantile = (values, q) => {
  const arr = Array.isArray(values)
    ? values.filter((v) => typeof v === 'number' && Number.isFinite(v))
    : [];
  if (arr.length === 0) return null;
  arr.sort((a, b) => a - b);
  const idx = Math.floor(arr.length * q);
  const safeIdx = Math.max(0, Math.min(arr.length - 1, idx));
  return arr[safeIdx];
};

// -------------------- Date Helpers --------------------

const getStartOfWeek = (date) => {
  // Monday-based week start (local time) to match how trades are stored/queried.
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun ... 6=Sat
  const diff = d.getDate() - ((day + 6) % 7);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfWeek = (date) => {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

const isSameDay = (d1, d2) => {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// -------------------- Stability Engine --------------------

const computeDaySignals = (dayTrades, tradingPlan) => {
  if (!Array.isArray(dayTrades) || dayTrades.length === 0) return null;

  const sortedAsc = [...dayTrades].sort(
    (a, b) => new Date(a.entryTime) - new Date(b.entryTime)
  );

  const tradeCount = sortedAsc.length;

  const preferredSessions = Array.isArray(tradingPlan?.preferredSessions)
    ? tradingPlan.preferredSessions
    : [];
  const hasPreferredSessions = preferredSessions.length > 0;

  const planRisk =
    typeof tradingPlan?.riskPercentPerTrade === 'number'
      ? tradingPlan.riskPercentPerTrade
      : null;
  const maxTradesPerDay =
    typeof tradingPlan?.maxTradesPerDay === 'number'
      ? tradingPlan.maxTradesPerDay
      : null;
  const targetRR =
    typeof tradingPlan?.targetRiskRewardRatio === 'number'
      ? tradingPlan.targetRiskRewardRatio
      : null;

  // --- Timing & duration stats ---
  const intervals = [];
  for (let i = 1; i < sortedAsc.length; i++) {
    const prevExit = sortedAsc[i - 1]?.exitTime
      ? new Date(sortedAsc[i - 1].exitTime)
      : null;
    const currEntry = sortedAsc[i]?.entryTime
      ? new Date(sortedAsc[i].entryTime)
      : null;
    if (!prevExit || !currEntry) continue;
    const diffMin = (currEntry - prevExit) / (1000 * 60);
    if (Number.isFinite(diffMin)) intervals.push(diffMin);
  }

  const durations = sortedAsc
    .map((t) => {
      if (!t?.entryTime || !t?.exitTime) return null;
      const ms = new Date(t.exitTime) - new Date(t.entryTime);
      if (!Number.isFinite(ms)) return null;
      return ms / (1000 * 60);
    })
    .filter((v) => v !== null);

  const durationsMedian = median(durations);
  const durationsCv = (() => {
    if (!durations.length || durations.length < 2) return null;
    if (durationsMedian === null || durationsMedian === 0) return null;
    return stdDev(durations) / Math.abs(durationsMedian);
  })();

  const intervalsMedian = median(intervals);
  const intervalsCv = (() => {
    if (!intervals.length || intervals.length < 2) return null;
    if (intervalsMedian === null || intervalsMedian === 0) return null;
    return stdDev(intervals) / Math.abs(intervalsMedian);
  })();

  // --- Session adherence ---
  const offSessionCount = hasPreferredSessions
    ? sortedAsc.filter((t) => !preferredSessions.includes(t.session)).length
    : 0;
  const offSessionRate = tradeCount > 0 ? offSessionCount / tradeCount : 0;

  // --- Rapid re-entry after loss ---
  const rapidReentryAfterLossCount = (() => {
    if (sortedAsc.length < 2) return 0;
    let count = 0;
    for (let i = 1; i < sortedAsc.length; i++) {
      const prev = sortedAsc[i - 1];
      const curr = sortedAsc[i];
      const prevExit = prev?.exitTime ? new Date(prev.exitTime) : null;
      const currEntry = curr?.entryTime ? new Date(curr.entryTime) : null;
      if (!prevExit || !currEntry) continue;
      const diffMin = (currEntry - prevExit) / (1000 * 60);
      if (!Number.isFinite(diffMin) || diffMin < 0) continue;
      if (
        diffMin < STABILITY_THRESHOLDS.rapidReentryMinutes &&
        prev?.profitLoss < 0
      ) {
        count++;
      }
    }
    return count;
  })();

  const clusteredIntervalsCount = intervals.filter(
    (m) => m >= 0 && m <= STABILITY_THRESHOLDS.burstMinutes
  ).length;

  const clusterRate = intervals.length
    ? clusteredIntervalsCount / intervals.length
    : 0;

  // --- Risk spike / sizing proxies ---
  const riskValues = sortedAsc
    .map((t) => (typeof t?.riskPercentUsed === 'number' ? t.riskPercentUsed : null))
    .filter((v) => v !== null);
  const riskMedian = median(riskValues);
  const riskSpikeCount =
    riskMedian === null
      ? 0
      : sortedAsc.filter(
          (t) =>
            typeof t?.riskPercentUsed === 'number' &&
            t.riskPercentUsed >=
              riskMedian * (1 + STABILITY_THRESHOLDS.riskSpikePct)
        ).length;
  const riskSpikeRate = tradeCount > 0 ? riskSpikeCount / tradeCount : 0;

  // --- Trait scores used for composite ---
  const impulsivenessScore = clampScore(
    100 *
      (0.3 * offSessionRate +
        0.35 * (rapidReentryAfterLossCount / Math.max(1, tradeCount - 1)) +
        0.2 * riskSpikeRate +
        0.15 * clusterRate)
  );

  // Hesitation: early exits, small-profit exits, quick breakevens, timing inconsistency.
  const earlyCloseCount = sortedAsc.filter((t) => t.exitedEarly === true).length;
  const earlyCloseRate = tradeCount > 0 ? earlyCloseCount / tradeCount : 0;

  const positiveProfits = sortedAsc
    .map((t) =>
      typeof t?.profitLoss === 'number' && t.profitLoss > 0 ? t.profitLoss : null
    )
    .filter((v) => v !== null);

  const smallProfitThreshold = positiveProfits.length
    ? pickQuantile(positiveProfits, 0.33)
    : null;
  const smallProfitCount =
    smallProfitThreshold === null
      ? 0
      : sortedAsc.filter(
          (t) =>
            typeof t?.profitLoss === 'number' &&
            t.profitLoss > 0 &&
            t.profitLoss <= smallProfitThreshold
        ).length;
  const smallProfitRate = tradeCount > 0 ? smallProfitCount / tradeCount : 0;

  const absProfits = sortedAsc
    .map((t) => (typeof t?.profitLoss === 'number' ? Math.abs(t.profitLoss) : null))
    .filter((v) => v !== null);
  const medianAbsProfit = median(absProfits);
  const breakevenEps =
    medianAbsProfit === null ? null : medianAbsProfit * 0.1;

  const medianDuration = median(durations);
  const maxBreakevenDuration =
    medianDuration === null ? null : medianDuration * 0.5;

  const breakevenSoonCount = (() => {
    if (breakevenEps === null || maxBreakevenDuration === null) return 0;
    let count = 0;
    for (const t of sortedAsc) {
      if (typeof t?.profitLoss !== 'number') continue;
      const abs = Math.abs(t.profitLoss);
      if (abs > breakevenEps) continue;
      const dur =
        t?.entryTime && t?.exitTime
          ? (new Date(t.exitTime) - new Date(t.entryTime)) / (1000 * 60)
          : null;
      if (dur === null || !Number.isFinite(dur)) continue;
      if (dur <= maxBreakevenDuration) count++;
    }
    return count;
  })();
  const breakevenSoonRate = tradeCount > 0 ? breakevenSoonCount / tradeCount : 0;

  const timingInconsistencyScore = (() => {
    if (durationsCv === null) return 50; // neutral
    return normalizeFromCv(durationsCv, 0.7);
  })();

  const hesitationScore = clampScore(
    100 * (0.36 * earlyCloseRate + 0.24 * smallProfitRate + 0.2 * breakevenSoonRate) +
      0.2 * timingInconsistencyScore
  );

  // Aggression balance: intensity close to neutral is good; extremes are bad.
  const aggressionIntensity = clampScore(
    100 * (0.6 * riskSpikeRate + 0.4 * clusterRate)
  );
  const aggressionBalance = clampScore(
    100 - Math.abs(aggressionIntensity - 50) * 2
  );

  // Consistency: stable risk sizing, session repeatability, stable pacing.
  const riskCv = (() => {
    if (riskValues.length < 2) return null;
    const mean = riskValues.reduce((a, b) => a + b, 0) / riskValues.length;
    if (!mean) return null;
    return stdDev(riskValues) / Math.abs(mean);
  })();

  const riskStabilityScore =
    riskCv === null ? 50 : normalizeFromCv(riskCv, STABILITY_THRESHOLDS.cvNormalizationScale);

  const sessionConsistencyScore = (() => {
    if (hasPreferredSessions) {
      return clampScore(((tradeCount - offSessionCount) / Math.max(1, tradeCount)) * 100);
    }
    const counts = sortedAsc.reduce((acc, t) => {
      acc[t.session] = (acc[t.session] || 0) + 1;
      return acc;
    }, {});
    const mode = Object.values(counts).reduce((m, v) => Math.max(m, v), 0);
    return clampScore((mode / Math.max(1, tradeCount)) * 100);
  })();

  const timingConsistencyScore = (() => {
    if (intervalsCv === null) return 50;
    return normalizeFromCv(intervalsCv, STABILITY_THRESHOLDS.cvNormalizationScale);
  })();

  const consistencyScore = clampScore(
    0.5 * riskStabilityScore + 0.3 * sessionConsistencyScore + 0.2 * timingConsistencyScore
  );

  // Discipline: SL usage on losing trades, RR/TP compliance, session adherence, trade limits.
  const losses = sortedAsc.filter((t) => typeof t?.profitLoss === 'number' && t.profitLoss < 0);
  const slUsageRate =
    losses.length === 0
      ? STABILITY_THRESHOLDS.slWinNeutralScore / 100
      : losses.filter((t) => t.stopLossHit === true).length / losses.length;
  const slScore = clampScore(slUsageRate * 100);

  const tradeLimitScore = (() => {
    if (maxTradesPerDay === null) return 50;
    if (tradeCount <= maxTradesPerDay) return 100;
    if (tradeCount === maxTradesPerDay + 1) return 70;
    return 30;
  })();

  const rrScore = (() => {
    if (targetRR === null) return 50;
    const rrTrades = sortedAsc.filter((t) => typeof t?.riskRewardAchieved === 'number');
    if (rrTrades.length > 0) {
      const compliant = rrTrades.filter((t) => t.riskRewardAchieved >= targetRR).length;
      return clampScore((compliant / rrTrades.length) * 100);
    }

    const tpTrades = sortedAsc.filter(
      (t) => typeof t?.targetPercentAchieved === 'number'
    );
    if (tpTrades.length === 0) return 50;
    const compliant = tpTrades.filter((t) => t.targetPercentAchieved >= STABILITY_THRESHOLDS.rrComplianceThresholdPercent).length;
    return clampScore((compliant / tpTrades.length) * 100);
  })();

  const sessionAdherenceScore = hasPreferredSessions
    ? clampScore(((tradeCount - offSessionCount) / Math.max(1, tradeCount)) * 100)
    : 100;

  const disciplineScore = clampScore(
    0.3 * sessionAdherenceScore + 0.25 * slScore + 0.25 * rrScore + 0.2 * tradeLimitScore
  );

  // Plan adherence: session adherence, risk sizing vs planRisk, timing discipline, RR/TP quality.
  const timingDisciplineRate = (() => {
    if (sortedAsc.length < 2) return 100;
    let passes = 0;
    let totalPairs = 0;
    for (let i = 1; i < sortedAsc.length; i++) {
      const prev = sortedAsc[i - 1];
      const curr = sortedAsc[i];
      const prevExit = prev?.exitTime ? new Date(prev.exitTime) : null;
      const currEntry = curr?.entryTime ? new Date(curr.entryTime) : null;
      if (!prevExit || !currEntry) continue;
      const diffMin = (currEntry - prevExit) / (1000 * 60);
      if (!Number.isFinite(diffMin)) continue;
      totalPairs++;
      if (diffMin >= STABILITY_THRESHOLDS.timingDisciplineMinutes) passes++;
    }
    if (totalPairs === 0) return 50;
    return clampScore((passes / totalPairs) * 100);
  })();

  const riskSizingScore = (() => {
    if (planRisk === null) return 50;
    const tradesWithRisk = sortedAsc.filter((t) => typeof t?.riskPercentUsed === 'number');
    if (tradesWithRisk.length === 0) return 50;
    const compliant = tradesWithRisk.filter((t) => {
      const v = t.riskPercentUsed;
      return v >= planRisk * 0.9 && v <= planRisk * 1.1;
    }).length;
    return clampScore((compliant / tradesWithRisk.length) * 100);
  })();

  const planAdherenceScore = clampScore(
    0.35 * sessionAdherenceScore + 0.25 * riskSizingScore + 0.2 * timingDisciplineRate + 0.2 * rrScore
  );

  // Loss reaction control: penalize rapid re-entry after loss and risk escalation after loss.
  const lossControlScore = (() => {
    if (losses.length === 0) return 100;
    const lossRisks = losses
      .map((t) => (typeof t?.riskPercentUsed === 'number' ? t.riskPercentUsed : null))
      .filter((v) => v !== null);
    const lossRiskBaseline = median(lossRisks);

    let revengeLikeCount = 0;
    for (let i = 1; i < sortedAsc.length; i++) {
      const prev = sortedAsc[i - 1];
      const curr = sortedAsc[i];
      if (!(prev?.profitLoss < 0)) continue;
      if (lossRiskBaseline === null) continue;
      if (typeof curr?.riskPercentUsed !== 'number') continue;
      if (
        curr.riskPercentUsed >=
        lossRiskBaseline * (1 + STABILITY_THRESHOLDS.riskSpikePct)
      ) {
        revengeLikeCount++;
      }
    }

    const rapidRate = rapidReentryAfterLossCount / Math.max(1, losses.length);
    const revengeRate = revengeLikeCount / Math.max(1, losses.length);
    const damageRate = 0.7 * rapidRate + 0.3 * revengeRate;
    return clampScore(100 - damageRate * 100);
  })();

  const compositeScore = clampScore(
    planAdherenceScore * STABILITY_WEIGHTS.planAdherence +
      disciplineScore * STABILITY_WEIGHTS.discipline +
      consistencyScore * STABILITY_WEIGHTS.consistency +
      (100 - impulsivenessScore) * STABILITY_WEIGHTS.impulsivenessInverse +
      aggressionBalance * STABILITY_WEIGHTS.aggressionBalance +
      (100 - hesitationScore) * STABILITY_WEIGHTS.hesitationInverse +
      lossControlScore * STABILITY_WEIGHTS.lossReactionControl
  );

  // Drivers (top positive and top negative contributor).
  const positiveContribs = [
    {
      key: 'planAdherence',
      v: STABILITY_WEIGHTS.planAdherence * planAdherenceScore,
      label: 'Followed session plan',
    },
    {
      key: 'discipline',
      v: STABILITY_WEIGHTS.discipline * disciplineScore,
      label: 'Risk and SL discipline',
    },
    {
      key: 'consistency',
      v: STABILITY_WEIGHTS.consistency * consistencyScore,
      label: 'Stable pacing & sizing',
    },
    {
      key: 'aggressionBalance',
      v: STABILITY_WEIGHTS.aggressionBalance * aggressionBalance,
      label: 'Balanced execution intensity',
    },
    {
      key: 'lossControl',
      v: STABILITY_WEIGHTS.lossReactionControl * lossControlScore,
      label: 'Controlled reaction after losses',
    },
  ];
  const topPositive = positiveContribs.reduce((best, x) => (!best || x.v > best.v ? x : best), null);

  const impulsiveLabel = (() => {
    if (rapidReentryAfterLossCount > 0) return 'Rapid re-entry after loss';
    if (hasPreferredSessions && offSessionCount > 0) return 'Off-session trading';
    if (riskSpikeCount > 0) return 'Lot/risk spikes';
    if (clusteredIntervalsCount > 0) return 'Clustered trades in short bursts';
    return 'Impulsive execution pattern';
  })();

  const hesitationLabel = (() => {
    if (earlyCloseCount > 0) return 'Early closes before TP';
    if (smallProfitCount > 0) return 'Small-profit exits';
    if (breakevenSoonCount > 0) return 'Quick breakeven exits';
    return 'Inconsistent exit timing';
  })();

  const negativeContribs = [
    {
      key: 'impulsiveness',
      damage: STABILITY_WEIGHTS.impulsivenessInverse * impulsivenessScore,
      label: impulsiveLabel,
    },
    {
      key: 'hesitation',
      damage: STABILITY_WEIGHTS.hesitationInverse * hesitationScore,
      label: hesitationLabel,
    },
    {
      key: 'lossControl',
      damage: STABILITY_WEIGHTS.lossReactionControl * (100 - lossControlScore),
      label: 'Poor loss reaction / revenge-like re-entry',
    },
    {
      key: 'aggressionBalance',
      damage: STABILITY_WEIGHTS.aggressionBalance * (100 - aggressionBalance),
      label: 'Unbalanced aggression intensity',
    },
  ];
  const topNegative = negativeContribs.reduce((best, x) => (!best || x.damage > best.damage ? x : best), null);

  return {
    score: Math.round(compositeScore),
    positiveDriver: topPositive?.label ?? 'Stable behavior',
    negativeDriver: topNegative?.label ?? 'Unstable behavior',
  };
};

// -------------------- Component --------------------

export default function PsychologicalStabilityTrend({
  selectedDate = null,
  trades = [],
  tradingPlan = null,
}) {
  const [dateRange, setDateRange] = useState(() => {
    const base = selectedDate ? new Date(selectedDate) : new Date();
    return { start: getStartOfWeek(base), end: getEndOfWeek(base) };
  });

  useEffect(() => {
    if (!selectedDate) return;
    const base = new Date(selectedDate);
    setDateRange({ start: getStartOfWeek(base), end: getEndOfWeek(base) });
  }, [selectedDate]);

  const chartData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    if (!selectedDate) {
      return days.map((dayLabel) => ({
        name: dayLabel,
        calm: null,
        focused: null,
        impulsive: null,
        emotional: null,
        date: null,
        positiveDriver: null,
        negativeDriver: null,
      }));
    }

    const safeTrades = Array.isArray(trades) ? trades : [];
    const selectedKey = toLocalDateKey(selectedDate);

    // Empty-date rule: if there are no trades on the selected day, do not reuse any prior/v2 data.
    const hasSelectedDayTrades = safeTrades.some((t) => {
      if (!t?.entryTime) return false;
      return toLocalDateKey(t.entryTime) === selectedKey;
    });

    if (!hasSelectedDayTrades) {
      return days.map((dayLabel, idx) => {
        const currentDay = new Date(dateRange.start);
        currentDay.setDate(dateRange.start.getDate() + idx);
        const key = toLocalDateKey(currentDay);
        return {
          name: dayLabel,
          calm: null,
          focused: null,
          impulsive: null,
          emotional: null,
          date: key,
          positiveDriver: null,
          negativeDriver: null,
        };
      });
    }

    // Bucket trades by UTC day key within the week.
    const buckets = new Map();
    const startUtc = new Date(dateRange.start);
    const endUtc = new Date(dateRange.end);

    safeTrades.forEach((t) => {
      if (!t?.entryTime) return;
      const d = new Date(t.entryTime);
      if (d < startUtc || d > endUtc) return;
      const key = toLocalDateKey(d);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(t);
    });

    let prevSmoothed = null;
    const trendData = [];

    const out = days.map((dayLabel, idx) => {
      const currentDay = new Date(dateRange.start);
      currentDay.setDate(dateRange.start.getDate() + idx);
      const key = toLocalDateKey(currentDay);
      const dayTrades = buckets.get(key) || [];

      if (!dayTrades.length) {
        return {
          name: dayLabel,
          calm: null,
          focused: null,
          impulsive: null,
          emotional: null,
          date: key,
          positiveDriver: null,
          negativeDriver: null,
        };
      }

      const signals = computeDaySignals(dayTrades, tradingPlan);
      const currentRaw = signals?.score ?? null;
      const smoothed =
        prevSmoothed === null || currentRaw === null
          ? currentRaw
          : clampScore(prevSmoothed * 0.7 + currentRaw * 0.3);

      prevSmoothed = smoothed;

      const point = {
        date: key,
        score: Math.round(smoothed),
        positiveDriver: signals?.positiveDriver ?? null,
        negativeDriver: signals?.negativeDriver ?? null,
      };
      trendData.push(point);

      return {
        name: dayLabel,
        calm: point.score,
        focused: null,
        impulsive: null,
        emotional: null,
        date: point.date,
        positiveDriver: point.positiveDriver,
        negativeDriver: point.negativeDriver,
      };
    });

    // Debug logs required by spec.
    console.log("USING TRADES:", safeTrades.length);
    console.log("STABILITY DATE:", selectedDate);
    console.log("TREND DATA:", trendData);
    console.log("FINAL TREND:", out);

    return out;
  }, [selectedDate, trades, tradingPlan, dateRange]);

  const isEmptyWeek = chartData.every(
    (d) => d.calm === null && d.focused === null && d.impulsive === null && d.emotional === null
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-[20px] p-6 h-full flex flex-col bg-gradient-to-r from-[#E6F6F6] to-[#EAEFF1] border border-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-gray-800">
          Psychological Stability Trend
        </h3>
        <div className="relative flex items-center gap-2 bg-[#F2F7F7] px-3 py-3 rounded-full text-xs font-normal text-[#363636] border border-[#FFFFFF] transition-colors hover:bg-[#EEF6F6]">
          <select
            defaultValue="Today"
            className="appearance-none bg-transparent pr-6 text-xs text-black font-normal leading-none outline-none"
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
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[160px] relative">
        {isEmptyWeek && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-gray-100 shadow-sm text-center">
              <ChartBarIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">
                No data available for this date
              </p>
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid vertical={false} stroke="#AAAAAA66" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
            />
            <YAxis
              domain={[0, 100]}
              hide={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              ticks={[0, 33, 66, 100]}
              tickFormatter={(value) => {
                if (value >= 95) return '6AM';
                if (value >= 60) return '9AM';
                if (value >= 30) return '12PM';
                return '3PM';
              }}
            />
            <Tooltip
              cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '4 4' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-lg z-50">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {data.date ? data.date : data.name} |{' '}
                        {data.calm === null || data.calm === undefined
                          ? '-'
                          : `${data.calm}%`}
                      </p>
                      <div className="space-y-1">
                        <p className="text-xs text-[#00BFA6]">
                          + <span className="font-medium text-gray-700">{data.positiveDriver ?? '—'}</span>
                        </p>
                        <p className="text-xs text-[#EF4444]">
                          - <span className="font-medium text-gray-700">{data.negativeDriver ?? '—'}</span>
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Line type="natural" dataKey="calm" stroke="black" strokeWidth={3} dot={false} connectNulls />
            <Line type="natural" dataKey="focused" stroke="#A5F3FC" strokeWidth={3} dot={false} connectNulls />
            <Line type="natural" dataKey="impulsive" stroke="#2DD4BF" strokeWidth={3} dot={false} connectNulls />
            <Line type="natural" dataKey="emotional" stroke="#0D9488" strokeWidth={3} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-white border border-gray-200"></div>
          <span className="text-xs sm:text-sm text-gray-500 font-medium">Calm</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#A5F3FC]"></div>
          <span className="text-xs sm:text-sm text-gray-500 font-medium">Focused</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#2DD4BF]"></div>
          <span className="text-xs sm:text-sm text-gray-500 font-medium">Impulsive</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0D9488]"></div>
          <span className="text-xs sm:text-sm text-gray-500 font-medium">Emotional</span>
        </div>
      </div>
    </motion.div>
  );
}
