import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "@/utils/api";

export function usePsychologicalState() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);
  const inFlightRef = useRef(false);

  const fetchState = useCallback(async (force = false) => {
    if (inFlightRef.current && !force) {
      return;
    }

    inFlightRef.current = true;
    setLoading(true);
    setError(null);
    setErrorStatus(null);

    try {
      const result = await apiClient.getPsychologicalState();
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      setErrorStatus(err.status || null);
      // Only log non-403 errors (403 for trading plan is expected for new users)
      if (err.status !== 403) {
        console.error("Error fetching psychological state:", err);
      }
      // Don't re-throw - let the component handle the error state gracefully
      return null;
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  return { data, loading, error, errorStatus, refetch: () => fetchState(true) };
}

export function useInsights(period = "MONTH") {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchInsights() {
      try {
        setLoading(true);
        setError(null);
        const result = await apiClient.getInsights(period);
        setData(result);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching insights:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, [period]);

  return { data, loading, error };
}

export function useForecast(session) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchForecast() {
      try {
        setLoading(true);
        setError(null);
        const result = await apiClient.getForecast(session);
        setData(result);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching forecast:", err);
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchForecast();
    }
  }, [session]);

  return { data, loading, error };
}
