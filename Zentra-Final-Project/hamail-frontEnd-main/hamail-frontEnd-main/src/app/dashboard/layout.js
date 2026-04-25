"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { apiClient } from "@/utils/api";
import { usePsychologicalState } from "@/app/hooks/useAnalysis";
import { STATE_CONFIG } from "@/components/StateIndicator";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../../tailwind.config.js";
import { TradingPlanProvider } from "@/context/TradingPlanContext";
import { PsychologicalStateProvider } from "@/context/PsychologicalStateContext";

const fullConfig = resolveConfig(tailwindConfig);
const colors = fullConfig.theme.colors;

// Helper function to convert hex to rgba
const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function DashboardRootLayout({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [planStatusLoading, setPlanStatusLoading] = useState(true);
  const [hasTradingPlan, setHasTradingPlan] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const {
    data: stateData,
    loading: stateLoading,
    error: stateError,
    errorStatus: stateErrorStatus,
    refetch: refetchPsychState,
  } = usePsychologicalState();
  const initialFetchDoneRef = useRef(false);

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

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setSidebarCollapsed(savedState === "true");
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", newState.toString());
  };

  const updateOnboardingFlag = useCallback((hasPlan) => {
    if (typeof window === "undefined") return;
    if (hasPlan) {
      localStorage.setItem("onboardingComplete", "true");
    } else {
      localStorage.removeItem("onboardingComplete");
    }
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = apiClient.getToken();

        if (!token) {
          router.push("/auth/login");
          return;
        }

        setAuthenticated(true);
      } catch (error) {
        console.error("Error checking authentication:", error);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchPlanStatus = useCallback(async () => {
    if (!authenticated) {
      return null;
    }

    setPlanStatusLoading(true);
    try {
      const status = await apiClient.getTradingPlanStatus();
      const hasPlan = !!status?.hasTradingPlan;

      setHasTradingPlan(hasPlan);
      updateOnboardingFlag(hasPlan);
      return hasPlan;
    } catch (error) {
      console.error("Error checking trading plan status:", error);

      if (error.status === 401) {
        router.push("/auth/login");
        return null;
      }

      const hasPlan = !(error.status === 403 || error.status === 404);
      setHasTradingPlan(hasPlan);
      updateOnboardingFlag(hasPlan);
      return hasPlan;
    } finally {
      setPlanStatusLoading(false);
    }
  }, [authenticated, router, updateOnboardingFlag]);

  useEffect(() => {
    if (!authenticated || initialFetchDoneRef.current) {
      return;
    }

    initialFetchDoneRef.current = true;
    fetchPlanStatus();
  }, [authenticated, fetchPlanStatus]);

  useEffect(() => {
    if (hasTradingPlan === false && pathname !== "/dashboard/plan") {
      router.replace("/dashboard/plan");
    }
  }, [hasTradingPlan, pathname, router]);

  const blockingPlanCheck =
    hasTradingPlan === null &&
    planStatusLoading &&
    pathname !== "/dashboard/plan";

  if (loading || blockingPlanCheck) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-secondary/5 via-white to-primary/5">
        <LoadingSpinner className="w-16 h-16" />
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <PsychologicalStateProvider
      value={{
        data: stateData,
        loading: stateLoading,
        error: stateError,
        errorStatus: stateErrorStatus,
        refetch: refetchPsychState,
      }}
    >
      <TradingPlanProvider
        value={{
          hasTradingPlan,
          statusLoading: planStatusLoading,
          refreshStatus: fetchPlanStatus,
          setHasTradingPlan,
        }}
      >
        <div className="fixed inset-0 bg-white">
          <style jsx global>{`
            nav {
              display: none !important;
            }
            footer {
              display: none !important;
            }
          `}</style>

          <div className="flex h-full">
            <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
            <div
              className={`flex-1 overflow-auto transition-all duration-300 w-full min-w-0 ${
                sidebarCollapsed ? "" : ""
              }`}
            >
              <div className="w-full py-2  md:pt-8  pt-16">
                {children}
              </div>
            </div>
          </div>
        </div>
      </TradingPlanProvider>
    </PsychologicalStateProvider>
  );
}
