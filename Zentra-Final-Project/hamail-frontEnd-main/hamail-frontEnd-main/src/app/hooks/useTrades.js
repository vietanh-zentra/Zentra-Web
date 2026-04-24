import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { apiClient } from "@/utils/api";

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes
const tradesStore = new Map();

const getRangeInfo = (params = {}) => {
  const page = Number(params.page || 1);
  const limit = Number(params.limit || 10);
  const start = (page - 1) * limit;
  const end = start + limit;
  return { page, limit, start, end };
};

const areFiltersEqual = (a = {}, b = {}) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  keys.delete("page");
  keys.delete("limit");

  for (const key of keys) {
    const valueA = a[key] ?? null;
    const valueB = b[key] ?? null;
    if (valueA !== valueB) {
      return false;
    }
  }

  return true;
};

const canSupersetCoverTarget = (superset, target, supersetData) => {
  if (!supersetData?.results?.length) return false;
  if (!areFiltersEqual(superset, target)) return false;

  const supersetRange = getRangeInfo(superset);
  const targetRange = getRangeInfo(target);
  const supersetEnd =
    supersetRange.start + (supersetData.results?.length || 0);

  return (
    targetRange.start >= supersetRange.start &&
    targetRange.end <= supersetEnd
  );
};

const deriveSubsetData = (supersetData, supersetParams, targetParams) => {
  if (!supersetData?.results) {
    return null;
  }

  const supersetRange = getRangeInfo(supersetParams);
  const targetRange = getRangeInfo(targetParams);
  const offset = targetRange.start - supersetRange.start;

  if (offset < 0) {
    return null;
  }

  const derivedResults = supersetData.results.slice(
    offset,
    offset + targetRange.limit
  );

  return {
    ...supersetData,
    results: derivedResults,
    page: targetRange.page,
    limit: targetRange.limit,
    totalPages: Math.max(
      1,
      Math.ceil(
        (supersetData.totalResults || supersetData.results.length || 1) /
          targetRange.limit
      )
    ),
  };
};

function getStoreEntry(key) {
  if (!tradesStore.has(key)) {
    tradesStore.set(key, {
      data: null,
      loading: false,
      error: null,
      lastFetched: 0,
      promise: null,
      paramsSnapshot: null,
      subscribers: new Set(),
      dependents: new Set(),
      supersetKey: null,
    });
  }
  return tradesStore.get(key);
}

function unlinkFromSuperset(key) {
  const entry = tradesStore.get(key);
  if (!entry || !entry.supersetKey) {
    return;
  }

  const supersetEntry = tradesStore.get(entry.supersetKey);
  if (supersetEntry) {
    supersetEntry.dependents.delete(key);
  }
  entry.supersetKey = null;
}

function linkToSuperset(childKey, supersetKey) {
  if (childKey === supersetKey) return;
  const childEntry = tradesStore.get(childKey);
  const supersetEntry = tradesStore.get(supersetKey);
  if (!childEntry || !supersetEntry) return;

  childEntry.supersetKey = supersetKey;
  supersetEntry.dependents.add(childKey);
}

function updateDependentsForEntry(entryKey) {
  const entry = tradesStore.get(entryKey);
  if (!entry?.dependents?.size) {
    return;
  }

  entry.dependents.forEach((dependentKey) => {
    const dependentEntry = tradesStore.get(dependentKey);
    if (!dependentEntry || !dependentEntry.paramsSnapshot) {
      return;
    }

    const derived = deriveSubsetData(
      entry.data,
      entry.paramsSnapshot,
      dependentEntry.paramsSnapshot
    );

    if (derived) {
      dependentEntry.data = derived;
      dependentEntry.lastFetched = entry.lastFetched;
      dependentEntry.error = null;
      dependentEntry.loading = false;
      notifySubscribers(dependentEntry);
    } else {
      // Superset no longer covers dependent range
      unlinkFromSuperset(dependentKey);
      dependentEntry.lastFetched = 0;
      if (dependentEntry.subscribers.size > 0) {
        loadTradesForKey(dependentKey, dependentEntry.paramsSnapshot, {
          force: true,
        });
      }
    }
  });
}

function findSupersetEntry(targetParams) {
  for (const [key, entry] of tradesStore.entries()) {
    if (!entry.data || !entry.paramsSnapshot) continue;
    if (canSupersetCoverTarget(entry.paramsSnapshot, targetParams, entry.data)) {
      return { key, entry };
    }
  }
  return null;
}

function notifySubscribers(entry) {
  const snapshot = {
    data: entry.data,
    loading: entry.loading,
    error: entry.error,
  };
  entry.subscribers.forEach((callback) => {
    callback(snapshot);
  });
}

async function loadTradesForKey(key, params, { force = false } = {}) {
  const entry = getStoreEntry(key);
  entry.paramsSnapshot = params;

  if (!force) {
    const supersetMatch = findSupersetEntry(params);
    if (
      supersetMatch &&
      supersetMatch.key !== key &&
      Date.now() - supersetMatch.entry.lastFetched < CACHE_TTL
    ) {
      const derived = deriveSubsetData(
        supersetMatch.entry.data,
        supersetMatch.entry.paramsSnapshot,
        params
      );

      if (derived) {
        entry.data = derived;
        entry.lastFetched = supersetMatch.entry.lastFetched;
        entry.error = null;
        entry.loading = false;
        entry.promise = null;
        linkToSuperset(key, supersetMatch.key);
        notifySubscribers(entry);
        return entry.data;
      }
    }
  }

  // No usable superset - ensure we're not linked from a previous one
  unlinkFromSuperset(key);

  const isFresh =
    entry.data && Date.now() - entry.lastFetched < CACHE_TTL && !force;

  if (isFresh) {
    entry.loading = false;
    notifySubscribers(entry);
    return entry.data;
  }

  if (entry.loading && entry.promise && !force) {
    return entry.promise;
  }

  entry.loading = true;
  entry.error = null;
  notifySubscribers(entry);

  const requestPromise = apiClient
    .getTrades(params)
    .then((result) => {
      entry.data = result;
      entry.lastFetched = Date.now();
      entry.error = null;
      updateDependentsForEntry(key);
      return result;
    })
    .catch((err) => {
      entry.error = err.message;
      if (err.status !== 403) {
        console.error("Error fetching trades:", err);
      }
      return null;
    })
    .finally(() => {
      entry.loading = false;
      entry.promise = null;
      notifySubscribers(entry);
    });

  entry.promise = requestPromise;
  return requestPromise;
}

export async function notifyTradesUpdated() {
  const entries = Array.from(tradesStore.entries());
  await Promise.all(
    entries.map(([key, entry]) => {
      entry.lastFetched = 0;
      if (entry.subscribers.size === 0 || !entry.paramsSnapshot) {
        entry.data = null;
        return null;
      }
      return loadTradesForKey(key, entry.paramsSnapshot, { force: true });
    })
  );
}

function serializeParams(params = {}) {
  const sortedKeys = Object.keys(params).sort();
  const normalized = {};
  sortedKeys.forEach((key) => {
    normalized[key] = params[key];
  });
  return JSON.stringify(normalized);
}

export function useTrades(params = {}) {
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const paramsKey = useMemo(() => serializeParams(params), [params]);
  const [state, setState] = useState(() => {
    const entry = getStoreEntry(paramsKey);
    return {
      data: entry.data,
      loading: entry.loading || !entry.data,
      error: entry.error,
    };
  });

  const fetchTrades = useCallback(
    (options = {}) => loadTradesForKey(paramsKey, paramsRef.current, options),
    [paramsKey]
  );

  useEffect(() => {
    let isMounted = true;
    const entry = getStoreEntry(paramsKey);

    const subscriber = (snapshot) => {
      if (!isMounted) return;
      setState({
        data: snapshot.data,
        loading: snapshot.loading,
        error: snapshot.error,
      });
    };

    entry.subscribers.add(subscriber);
    subscriber({
      data: entry.data,
      loading: entry.loading,
      error: entry.error,
    });

    // Only fetch if we don't have fresh data
    const needsFetch =
      !entry.data || Date.now() - entry.lastFetched >= CACHE_TTL;
    if (needsFetch) {
      fetchTrades();
    }

    return () => {
      isMounted = false;
      entry.subscribers.delete(subscriber);
    };
  }, [paramsKey, fetchTrades]);

  const refetch = useCallback(
    () => fetchTrades({ force: true }),
    [fetchTrades]
  );

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch,
  };
}

export function useTrade(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTrade() {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const result = await apiClient.getTrade(id);
        setData(result);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching trade:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTrade();
  }, [id]);

  return { data, loading, error };
}

export function useTradeActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createTrade = async (tradeData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.createTrade(tradeData);
      await notifyTradesUpdated();
      return result;
    } catch (err) {
      setError(err.message);
      console.error("Error creating trade:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTrade = async (id, tradeData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.updateTrade(id, tradeData);
      await notifyTradesUpdated();
      return result;
    } catch (err) {
      setError(err.message);
      console.error("Error updating trade:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTrade = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.deleteTrade(id);
      await notifyTradesUpdated();
    } catch (err) {
      setError(err.message);
      console.error("Error deleting trade:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const bulkImport = async (trades) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.bulkImportTrades(trades);
      await notifyTradesUpdated();
      return result;
    } catch (err) {
      setError(err.message);
      console.error("Error importing trades:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createTrade,
    updateTrade,
    deleteTrade,
    bulkImport,
    loading,
    error,
  };
}
