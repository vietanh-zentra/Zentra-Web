"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "@/utils/api";

/**
 * Generic behavioral analysis hook factory
 * @param {Function} apiFn - API method to call
 * @param {Array} deps - additional dependencies
 */
function useBehaviorEndpoint(apiFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setData(null);
    setError(null);

    try {
      const res = await apiFn();
      if (requestId !== requestIdRef.current) return;
      setData(res);
      return res;
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message);
      setData(null);
      // Silently handle 403/404 — expected when no data
      if (err.status !== 403 && err.status !== 404) {
        console.error("Behavior API error:", err);
      }
      return null;
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook: Revenge Trading Detection
 * Response: { detected, count, severity, revenge_rate, total_losses, trades[] }
 */
export function useRevengeTrading(date = null) {
  return useBehaviorEndpoint(
    () => apiClient.getRevengeTrading(date),
    [date]
  );
}

/**
 * Hook: Early Exit Detection
 * Response: { rate, count, total_winners, avg_winner_duration_sec,
 *             avg_winner_profit, potential_missed_profit, trades[] }
 */
export function useEarlyExits(date = null) {
  return useBehaviorEndpoint(
    () => apiClient.getEarlyExits(date),
    [date]
  );
}

/**
 * Hook: Overtrading Detection
 * Response: { detected, daily_avg, threshold, peak_day, peak_count,
 *             overtrading_days, total_days, excess_trades, daily_breakdown[] }
 */
export function useOvertrading(date = null) {
  return useBehaviorEndpoint(
    () => apiClient.getOvertrading(date),
    [date]
  );
}

/**
 * Hook: Impulsive Entry Detection
 * Response: { rate, cluster_count, total_impulsive_trades, avg_gap_seconds, clusters[] }
 */
export function useImpulsiveEntries(date = null) {
  return useBehaviorEndpoint(
    () => apiClient.getImpulsiveEntries(date),
    [date]
  );
}

/**
 * Hook: Behavioral Mental Battery (composite score)
 * Response: { percentage, level, message, factors[], details{} }
 */
export function useBehaviorMentalBattery(date = null) {
  return useBehaviorEndpoint(
    () => apiClient.getBehaviorMentalBattery(date),
    [date]
  );
}

/**
 * Hook: Full Behavioral Analysis (all detections at once)
 * Response: { revenge_trading, early_exits, overtrading, impulsive_entries,
 *             mental_battery, trade_count, analyzed_at }
 */
export function useFullBehaviorAnalysis(date = null) {
  return useBehaviorEndpoint(
    () => apiClient.getFullBehaviorAnalysis(date),
    [date]
  );
}
