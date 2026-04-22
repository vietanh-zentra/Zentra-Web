"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { apiClient } from "@/utils/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import Toast from "@/components/Toast";

/**
 * FEAT-02: Open Positions + FEAT-03: Pending Orders
 * Combined view for live MT5 positions and pending orders
 */
export default function MT5PositionsCard() {
  const [positions, setPositions] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("positions");

  const fetchData = async () => {
    try {
      setLoading(true);
      // Use fullSyncV2 data or individual endpoints
      const [syncResult] = await Promise.allSettled([
        apiClient.fullSyncV2(),
      ]);

      if (syncResult.status === "fulfilled") {
        const data = syncResult.value;
        setPositions(data.positions || []);
        setPendingOrders(data.pendingOrders || []);
      } else {
        // Fallback: try pending orders endpoint
        try {
          const pendingData = await apiClient.getPendingOrders();
          setPendingOrders(pendingData.orders || []);
        } catch {}
      }
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load positions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (val) => {
    if (val == null) return "—";
    return Number(val).toFixed(5);
  };

  const formatCurrency = (val) => {
    if (val == null) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
  };

  if (loading) {
    return (
      <div className="rounded-2xl p-6 backdrop-blur-xl animate-pulse"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.25) 100%)",
          border: "1px solid rgba(255,255,255,0.2)",
          boxShadow: "0 8px 32px rgba(0,0,128,0.08)",
        }}>
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "positions", label: `Open Positions (${positions.length})` },
    { key: "pending", label: `Pending Orders (${pendingOrders.length})` },
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">MT5 Live View</h3>
        <button
          onClick={fetchData}
          className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-white/40 transition-all"
          title="Refresh"
        >
          <ArrowPathIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white/30 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-gray-500 text-center py-4">
          {error || "Connect MT5 to view positions"}
        </p>
      )}

      {/* Positions Table */}
      {activeTab === "positions" && !error && (
        <div className="overflow-x-auto">
          {positions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No open positions</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200/50">
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Symbol</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Type</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500">Volume</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500">Open</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500">Current</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500">SL</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500">TP</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500">P/L</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos, idx) => (
                  <tr key={pos.ticket || idx} className="border-b border-gray-100/50 hover:bg-white/30">
                    <td className="py-2 px-2 font-semibold text-gray-900">{pos.symbol}</td>
                    <td className="py-2 px-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        pos.type === "BUY" || pos.type === 0
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}>
                        {pos.type === 0 ? "BUY" : pos.type === 1 ? "SELL" : pos.type}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right text-gray-900">{pos.volume?.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-gray-600">{formatPrice(pos.priceOpen || pos.openPrice)}</td>
                    <td className="py-2 px-2 text-right text-gray-900">{formatPrice(pos.priceCurrent || pos.currentPrice)}</td>
                    <td className="py-2 px-2 text-right text-gray-500">{pos.sl ? formatPrice(pos.sl) : "—"}</td>
                    <td className="py-2 px-2 text-right text-gray-500">{pos.tp ? formatPrice(pos.tp) : "—"}</td>
                    <td className={`py-2 px-2 text-right font-semibold ${
                      (pos.profit ?? 0) >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}>
                      {formatCurrency(pos.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Pending Orders Table */}
      {activeTab === "pending" && !error && (
        <div className="overflow-x-auto">
          {pendingOrders.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No pending orders</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200/50">
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Symbol</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Type</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500">Volume</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500">Price</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500">SL</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500">TP</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.map((order, idx) => (
                  <tr key={order.ticket || idx} className="border-b border-gray-100/50 hover:bg-white/30">
                    <td className="py-2 px-2 font-semibold text-gray-900">{order.symbol}</td>
                    <td className="py-2 px-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {order.typeDescription || order.type}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right text-gray-900">{order.volumeInitial?.toFixed(2) || order.volume?.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-gray-900">{formatPrice(order.priceOpen || order.price)}</td>
                    <td className="py-2 px-2 text-right text-gray-500">{order.sl ? formatPrice(order.sl) : "—"}</td>
                    <td className="py-2 px-2 text-right text-gray-500">{order.tp ? formatPrice(order.tp) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
