import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/utils/api";

export function useUser() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.getCurrentUser();
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      console.error("Error fetching user:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { data, loading, error, refetch: fetchUser };
}

