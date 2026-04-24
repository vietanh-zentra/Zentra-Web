import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "@/utils/api";

/**
 * Hook to fetch mental battery status from Zentra V2 API
 */
export function useMentalBattery(date = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async (force = false) => {
    const requestId = ++requestIdRef.current;

    // Clear previous state immediately so UI never shows stale data.
    console.log("FETCHING DATA FOR DATE:", date);
    setLoading(true);
    setData(null);
    setError(null);
    setErrorStatus(null);

    try {
      const res = await apiClient.getMentalBattery(date);
      console.log("API RESPONSE:", res);

      if (requestId !== requestIdRef.current) return res;

      if (!res || (Array.isArray(res) && res.length === 0)) {
        setData(null);
        return null;
      }

      setData(res);
      return res;
    } catch (err) {
      if (requestId !== requestIdRef.current) return null;

      setError(err.message);
      setErrorStatus(err.status || null);
      // Only log non-403 errors (403 for trading plan is expected for new users)
      if (err.status !== 403) {
        console.error("Error fetching mental battery:", err);
      }
      setData(null);
      return null;
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, errorStatus, refetch: () => fetchData(true) };
}

/**
 * Hook to fetch plan control percentage from Zentra V2 API
 */
export function usePlanControl(date = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async (force = false) => {
    const requestId = ++requestIdRef.current;

    console.log("FETCHING DATA FOR DATE:", date);
    setLoading(true);
    setData(null);
    setError(null);
    setErrorStatus(null);

    try {
      const res = await apiClient.getPlanControl(date);
      console.log("API RESPONSE:", res);

      if (requestId !== requestIdRef.current) return res;

      if (!res || (Array.isArray(res) && res.length === 0)) {
        setData(null);
        return null;
      }

      setData(res);
      return res;
    } catch (err) {
      if (requestId !== requestIdRef.current) return null;

      setError(err.message);
      setErrorStatus(err.status || null);
      // Only log non-403 errors (403 for trading plan is expected for new users)
      if (err.status !== 403) {
        console.error("Error fetching plan control:", err);
      }
      setData(null);
      return null;
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, errorStatus, refetch: () => fetchData(true) };
}

/**
 * Hook to fetch behavior heatmap from Zentra V2 API
 */
export function useBehaviorHeatmap(date = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async (force = false) => {
    const requestId = ++requestIdRef.current;

    console.log("FETCHING DATA FOR DATE:", date);
    setLoading(true);
    setData(null);
    setError(null);
    setErrorStatus(null);

    try {
      const res = await apiClient.getBehaviorHeatmap(date);
      console.log("API RESPONSE:", res);

      if (requestId !== requestIdRef.current) return res;

      if (!res || (Array.isArray(res) && res.length === 0)) {
        setData(null);
        return null;
      }

      setData(res);
      return res;
    } catch (err) {
      if (requestId !== requestIdRef.current) return null;

      setError(err.message);
      setErrorStatus(err.status || null);
      // Only log non-403 errors (403 for trading plan is expected for new users)
      if (err.status !== 403) {
        console.error("Error fetching behavior heatmap:", err);
      }
      setData(null);
      return null;
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
    }
  }, [date]);

  const fetchHistory = useCallback(async (startDate, endDate) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setData(null);
    setError(null);
    setErrorStatus(null);

    try {
      console.log("FETCHING DATA FOR DATE:", date);
      const result = await apiClient.getBehaviorHeatmapHistory(
        startDate,
        endDate
      );

      console.log("API RESPONSE:", result);

      if (requestId !== requestIdRef.current) return result;

      // API returns {history: [...], count: 0}
      // Extract the first item from history array if it exists for the hook's data state
      const historyData =
        result?.history &&
        Array.isArray(result.history) &&
        result.history.length > 0
          ? result.history[0]
          : result;

      if (!result || (Array.isArray(result) && result.length === 0)) {
        setData(null);
      } else if (Array.isArray(result?.history) && result.history.length === 0) {
        setData(null);
      } else {
        setData(historyData);
      }
      // Return full result so component can handle the history array structure
      return result;
    } catch (err) {
      if (requestId !== requestIdRef.current) return null;
      setError(err.message);
      setErrorStatus(err.status || null);
      if (err.status !== 403) {
        console.error("Error fetching behavior heatmap history:", err);
      }
      setData(null);
      return null;
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    errorStatus,
    refetch: () => fetchData(true),
    fetchHistory,
  };
}

/**
 * Hook to fetch psychological radar from Zentra V2 API
 */
export function usePsychologicalRadar(date = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async (force = false) => {
    const requestId = ++requestIdRef.current;

    console.log("FETCHING DATA FOR DATE:", date);
    setLoading(true);
    setData(null);
    setError(null);
    setErrorStatus(null);

    try {
      const res = await apiClient.getPsychologicalRadar(date);
      console.log("API RESPONSE:", res);

      if (requestId !== requestIdRef.current) return res;

      if (!res || (Array.isArray(res) && res.length === 0)) {
        setData(null);
        return null;
      }

      setData(res);
      return res;
    } catch (err) {
      if (requestId !== requestIdRef.current) return null;

      setError(err.message);
      setErrorStatus(err.status || null);
      // Only log non-403 errors (403 for trading plan is expected for new users)
      if (err.status !== 403) {
        console.error("Error fetching psychological radar:", err);
      }
      setData(null);
      return null;
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, errorStatus, refetch: () => fetchData(true) };
}

/**
 * Hook to fetch breathwork suggestion from Zentra V2 API
 */
export function useBreathworkSuggestion(date = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async (force = false) => {
    const requestId = ++requestIdRef.current;

    console.log("FETCHING DATA FOR DATE:", date);
    setLoading(true);
    setData(null);
    setError(null);
    setErrorStatus(null);

    try {
      const res = await apiClient.getBreathworkSuggestion(date);
      console.log("API RESPONSE:", res);

      if (requestId !== requestIdRef.current) return res;

      if (!res || (Array.isArray(res) && res.length === 0)) {
        setData(null);
        return null;
      }

      setData(res);
      return res;
    } catch (err) {
      if (requestId !== requestIdRef.current) return null;

      setError(err.message);
      setErrorStatus(err.status || null);
      // Only log non-403 errors (403 for trading plan is expected for new users)
      if (err.status !== 403) {
        console.error("Error fetching breathwork suggestion:", err);
      }
      setData(null);
      return null;
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, errorStatus, refetch: () => fetchData(true) };
}

/**
 * Hook to fetch performance window from Zentra V2 API
 */
export function usePerformanceWindow(date = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async (force = false) => {
    const requestId = ++requestIdRef.current;

    console.log("FETCHING DATA FOR DATE:", date);
    setLoading(true);
    setData(null);
    setError(null);
    setErrorStatus(null);

    try {
      const res = await apiClient.getPerformanceWindow(date);
      console.log("API RESPONSE:", res);

      if (requestId !== requestIdRef.current) return res;

      if (!res || (Array.isArray(res) && res.length === 0)) {
        setData(null);
        return null;
      }

      setData(res);
      return res;
    } catch (err) {
      if (requestId !== requestIdRef.current) return null;

      setError(err.message);
      setErrorStatus(err.status || null);
      // Only log non-403 errors (403 for trading plan is expected for new users)
      if (err.status !== 403) {
        console.error("Error fetching performance window:", err);
      }
      setData(null);
      return null;
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, errorStatus, refetch: () => fetchData(true) };
}

/**
 * Hook to fetch consistency trend from Zentra V2 API
 */
export function useConsistencyTrend(days = "7", date = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(
    async (force = false) => {
      const requestId = ++requestIdRef.current;

      console.log("FETCHING DATA FOR DATE:", date);
      setLoading(true);
      setData(null);
      setError(null);
      setErrorStatus(null);

      try {
        const res = await apiClient.getConsistencyTrend(days, date);
        console.log("API RESPONSE:", res);

        if (requestId !== requestIdRef.current) return res;

        if (!res || (Array.isArray(res) && res.length === 0)) {
          setData(null);
          return null;
        }

        setData(res);
        return res;
      } catch (err) {
        if (requestId !== requestIdRef.current) return null;

        setError(err.message);
        setErrorStatus(err.status || null);
        // Only log non-403 errors (403 for trading plan is expected for new users)
        if (err.status !== 403) {
          console.error("Error fetching consistency trend:", err);
        }
        return null;
      } finally {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
      }
    },
    [days, date]
  );

  const fetchHistory = useCallback(async (startDate, endDate) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setData(null);
    setError(null);
    setErrorStatus(null);

    try {
      console.log("FETCHING DATA FOR DATE:", date);
      const result = await apiClient.getConsistencyTrendHistory(
        startDate,
        endDate
      );

      console.log("API RESPONSE:", result);

      if (requestId !== requestIdRef.current) return result;

      if (!result || (Array.isArray(result) && result.length === 0)) {
        setData(null);
      } else {
        setData(result);
      }
      return result;
    } catch (err) {
      if (requestId !== requestIdRef.current) return null;

      setError(err.message);
      setErrorStatus(err.status || null);
      if (err.status !== 403) {
        console.error("Error fetching consistency trend history:", err);
      }
      setData(null);
      return null;
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    errorStatus,
    refetch: () => fetchData(true),
    fetchHistory,
  };
}

/**
 * Hook to fetch daily quote from Zentra V2 API
 */
export function useDailyQuote(date = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async (force = false) => {
    const requestId = ++requestIdRef.current;

    console.log("FETCHING DATA FOR DATE:", date);
    setLoading(true);
    setData(null);
    setError(null);
    setErrorStatus(null);

    try {
      const res = await apiClient.getDailyQuote(date);
      console.log("API RESPONSE:", res);

      if (requestId !== requestIdRef.current) return res;

      if (!res || (Array.isArray(res) && res.length === 0)) {
        setData(null);
        return null;
      }

      setData(res);
      return res;
    } catch (err) {
      if (requestId !== requestIdRef.current) return null;

      setError(err.message);
      setErrorStatus(err.status || null);
      // Only log non-403 errors (403 for trading plan is expected for new users)
      if (err.status !== 403) {
        console.error("Error fetching daily quote:", err);
      }
      setData(null);
      return null;
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, errorStatus, refetch: () => fetchData(true) };
}
