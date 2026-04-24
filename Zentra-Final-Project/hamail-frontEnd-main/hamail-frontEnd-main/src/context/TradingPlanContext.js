"use client";
import { createContext, useContext } from "react";

const TradingPlanContext = createContext({
  hasTradingPlan: null,
  statusLoading: true,
  refreshStatus: async () => {},
  setHasTradingPlan: () => {},
});

export const TradingPlanProvider = ({ value, children }) => (
  <TradingPlanContext.Provider value={value}>
    {children}
  </TradingPlanContext.Provider>
);

export const useTradingPlan = () => useContext(TradingPlanContext);

export default TradingPlanContext;
