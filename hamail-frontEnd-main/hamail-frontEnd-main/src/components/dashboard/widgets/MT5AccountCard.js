"use client";
import { useState, useEffect } from "react";
import { apiClient } from "@/utils/api";

/**
 * FEAT-01: MT5 Account Overview Widget
 * Shows balance, equity, margin, free margin, leverage, etc.
 */
export default function MT5AccountCard() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getAccountFull();
        setAccount(data.account || data);
        setError(null);
      } catch (err) {
        setError(err.message || "Failed to load account data");
      } finally {
        setLoading(false);
      }
    };
    fetchAccount();
    // Refresh every 30s
    const interval = setInterval(fetchAccount, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl p-6 backdrop-blur-xl animate-pulse"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.25) 100%)",
          border: "1px solid rgba(255,255,255,0.2)",
          boxShadow: "0 8px 32px rgba(0,0,128,0.08)",
        }}>
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="rounded-2xl p-6 backdrop-blur-xl"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.25) 100%)",
          border: "1px solid rgba(255,255,255,0.2)",
          boxShadow: "0 8px 32px rgba(0,0,128,0.08)",
        }}>
        <h3 className="text-lg font-bold text-gray-900 mb-2">MT5 Account</h3>
        <p className="text-sm text-gray-500">
          {error || "Connect your MT5 account to see account data"}
        </p>
      </div>
    );
  }

  const formatNum = (val, decimals = 2) => {
    if (val == null) return "—";
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  const profitColor = (account.profit ?? 0) >= 0 ? "text-emerald-600" : "text-red-500";
  const marginLevelColor =
    (account.marginLevel ?? 0) > 200
      ? "text-emerald-600"
      : (account.marginLevel ?? 0) > 100
      ? "text-amber-500"
      : "text-red-500";

  const stats = [
    { label: "Balance", value: `$${formatNum(account.balance)}`, color: "text-gray-900" },
    { label: "Equity", value: `$${formatNum(account.equity)}`, color: "text-gray-900" },
    { label: "Profit", value: `$${formatNum(account.profit)}`, color: profitColor },
    { label: "Margin", value: `$${formatNum(account.margin)}`, color: "text-gray-900" },
    { label: "Free Margin", value: `$${formatNum(account.freeMargin ?? account.margin_free)}`, color: "text-gray-900" },
    { label: "Margin Level", value: account.marginLevel ? `${formatNum(account.marginLevel)}%` : "—", color: marginLevelColor },
    { label: "Leverage", value: account.leverage ? `1:${account.leverage}` : "—", color: "text-gray-900" },
    { label: "Currency", value: account.currency || "USD", color: "text-gray-900" },
  ];

  return (
    <div
      className="rounded-2xl p-6 backdrop-blur-xl transition-all duration-300"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.25) 100%)",
        border: "1px solid rgba(255,255,255,0.2)",
        boxShadow: "0 8px 32px rgba(0,0,128,0.08)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">MT5 Account</h3>
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">
          {account.tradeModeDescription || (account.tradeMode === 0 ? "Demo" : "Real")}
        </span>
      </div>

      {/* Main balance row */}
      <div className="mb-4 pb-4 border-b border-gray-200/60">
        <p className="text-sm text-gray-500">Account Balance</p>
        <p className="text-3xl font-bold text-gray-900">${formatNum(account.balance)}</p>
        <p className={`text-sm font-semibold ${profitColor} mt-1`}>
          {(account.profit ?? 0) >= 0 ? "▲" : "▼"} ${formatNum(Math.abs(account.profit ?? 0))} P/L
        </p>
      </div>

      {/* Grid stats */}
      <div className="grid grid-cols-2 gap-3">
        {stats.slice(1).map((stat) => (
          <div key={stat.label} className="bg-white/40 rounded-xl px-3 py-2">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className={`text-sm font-semibold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Server info */}
      <div className="mt-3 pt-3 border-t border-gray-200/60 flex items-center justify-between text-xs text-gray-400">
        <span>Login: {account.login || "—"}</span>
        <span>{account.server || account.company || "—"}</span>
      </div>
    </div>
  );
}
