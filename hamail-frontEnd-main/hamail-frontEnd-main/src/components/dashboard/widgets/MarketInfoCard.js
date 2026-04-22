"use client";
import { useState, useEffect } from "react";
import { apiClient } from "@/utils/api";
import { ArrowPathIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

/**
 * FEAT-06: Symbol/Market Info + FEAT-08: Terminal Info
 * Market watch with search + terminal status
 */
export default function MarketInfoCard() {
  const [symbols, setSymbols] = useState([]);
  const [terminal, setTerminal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [symbolDetail, setSymbolDetail] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [symbolsResult, terminalResult] = await Promise.allSettled([
          apiClient.getSymbols(),
          apiClient.getTerminalInfo(),
        ]);

        if (symbolsResult.status === "fulfilled") {
          setSymbols(symbolsResult.value.symbols || symbolsResult.value || []);
        }
        if (terminalResult.status === "fulfilled") {
          setTerminal(terminalResult.value.terminal || terminalResult.value);
        }
        setError(null);
      } catch (err) {
        setError(err.message || "Failed to load market data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSymbolClick = async (symbolName) => {
    if (selectedSymbol === symbolName) {
      setSelectedSymbol(null);
      setSymbolDetail(null);
      return;
    }
    setSelectedSymbol(symbolName);
    try {
      const detail = await apiClient.getSymbolDetail(symbolName);
      setSymbolDetail(detail.symbol || detail);
    } catch {
      setSymbolDetail(null);
    }
  };

  const filtered = search
    ? symbols.filter((s) => {
        const name = (s.name || s.symbol || "").toLowerCase();
        const desc = (s.description || "").toLowerCase();
        return name.includes(search.toLowerCase()) || desc.includes(search.toLowerCase());
      })
    : symbols.slice(0, 30);

  if (loading) {
    return (
      <div className="rounded-2xl p-6 backdrop-blur-xl animate-pulse"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.25) 100%)",
          border: "1px solid rgba(255,255,255,0.2)",
          boxShadow: "0 8px 32px rgba(0,0,128,0.08)",
        }}>
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-8 bg-gray-200 rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-6 backdrop-blur-xl transition-all duration-300"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.25) 100%)",
        border: "1px solid rgba(255,255,255,0.2)",
        boxShadow: "0 8px 32px rgba(0,0,128,0.08)",
      }}
    >
      {/* Terminal status bar */}
      {terminal && (
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200/50">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${terminal.connected ? "bg-emerald-500" : "bg-red-500"}`} />
            <span className="text-xs text-gray-500">
              MT5 {terminal.version ? `v${terminal.version}` : "Terminal"}
              {terminal.build ? ` (${terminal.build})` : ""}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {terminal.company || terminal.name || ""}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900">Market Watch</h3>
        <span className="text-xs text-gray-400">{symbols.length} symbols</span>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search symbols..."
          className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white/50 focus:ring-1 focus:ring-primary focus:border-transparent"
        />
      </div>

      {error ? (
        <p className="text-sm text-gray-500 text-center py-4">{error}</p>
      ) : (
        <div className="overflow-y-auto max-h-64 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No symbols found</p>
          ) : (
            filtered.map((sym, idx) => {
              const name = sym.name || sym.symbol;
              const isSelected = selectedSymbol === name;
              return (
                <div key={name || idx}>
                  <button
                    onClick={() => handleSymbolClick(name)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all text-xs ${
                      isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-white/40"
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-gray-900">{name}</span>
                      {sym.description && (
                        <span className="text-gray-400 ml-2">{sym.description}</span>
                      )}
                    </div>
                    <div className="text-right">
                      {sym.spread != null && (
                        <span className="text-gray-500">Spread: {sym.spread}</span>
                      )}
                    </div>
                  </button>

                  {/* Symbol detail panel */}
                  {isSelected && symbolDetail && (
                    <div className="ml-3 mt-1 mb-2 p-3 bg-white/40 rounded-lg grid grid-cols-2 gap-2 text-xs">
                      {symbolDetail.digits != null && (
                        <div><span className="text-gray-500">Digits:</span> <span className="font-medium">{symbolDetail.digits}</span></div>
                      )}
                      {symbolDetail.volumeMin != null && (
                        <div><span className="text-gray-500">Min Vol:</span> <span className="font-medium">{symbolDetail.volumeMin}</span></div>
                      )}
                      {symbolDetail.volumeMax != null && (
                        <div><span className="text-gray-500">Max Vol:</span> <span className="font-medium">{symbolDetail.volumeMax}</span></div>
                      )}
                      {symbolDetail.volumeStep != null && (
                        <div><span className="text-gray-500">Vol Step:</span> <span className="font-medium">{symbolDetail.volumeStep}</span></div>
                      )}
                      {symbolDetail.tradeMode != null && (
                        <div><span className="text-gray-500">Trade Mode:</span> <span className="font-medium">{symbolDetail.tradeModeDescription || symbolDetail.tradeMode}</span></div>
                      )}
                      {symbolDetail.category && (
                        <div><span className="text-gray-500">Category:</span> <span className="font-medium">{symbolDetail.category}</span></div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
