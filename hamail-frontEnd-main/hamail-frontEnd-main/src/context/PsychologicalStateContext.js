"use client";
import { createContext, useContext } from "react";

const PsychologicalStateContext = createContext({
  data: null,
  loading: true,
  error: null,
  errorStatus: null,
  refetch: async () => {},
});

export const PsychologicalStateProvider = ({ value, children }) => (
  <PsychologicalStateContext.Provider value={value}>
    {children}
  </PsychologicalStateContext.Provider>
);

export const usePsychologicalStateContext = () =>
  useContext(PsychologicalStateContext);

export default PsychologicalStateContext;
