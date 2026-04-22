"use client";
import { useState, useEffect } from "react";
import { apiClient } from "@/utils/api";
import { ArrowPathIcon, FunnelIcon } from "@heroicons/react/24/outline";

/**
 * FEAT-04: Order History
 * Searchable, filterable history of all MT5 orders (filled, cancelled, expired)
 */
export default function OrderHistoryCard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, filled, cancelled

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getOrderHistory();
      setOrders(data.orders || data.history || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load order history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatPrice = (val) => {
    if (val == null) return "—";
    return Number(val).toFixed(5);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  const filteredOrders = filter === "all"
    ? orders
    : orders.filter((o) => {
        const state = (o.state || o.stateDescription || "").toLowerCase();
        if (filter === "filled") return state.includes("filled") || state.includes("done");
        if (filter === "cancelled") return state.includes("cancel") || state.includes("expired");
        return true;
      });

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
          {[1,2,3,4].map(i => <div key={i} className="h-10 bg-gray-200 rounded" />)}
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Order History</h3>
        <div className="flex items-center gap-2">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white/50 focus:ring-1 focus:ring-primary"
          >
            <option value="all">All ({orders.length})</option>
            <option value="filled">Filled</option>
            <option value="cancelled">Cancelled/Expired</option>
          </select>
          <button
            onClick={fetchOrders}
            className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-white/40 transition-all"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-gray-500 text-center py-4">{error}</p>
      ) : filteredOrders.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">No orders found</p>
      ) : (
        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white/80 backdrop-blur-sm">
              <tr className="border-b border-gray-200/50">
                <th className="text-left py-2 px-2 font-medium text-gray-500">Time</th>
                <th className="text-left py-2 px-2 font-medium text-gray-500">Symbol</th>
                <th className="text-left py-2 px-2 font-medium text-gray-500">Type</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500">Volume</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500">Price</th>
                <th className="text-left py-2 px-2 font-medium text-gray-500">State</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.slice(0, 50).map((order, idx) => (
                <tr key={order.ticket || idx} className="border-b border-gray-100/50 hover:bg-white/30">
                  <td className="py-1.5 px-2 text-gray-600">
                    {formatDate(order.timeSetup || order.timeDone || order.time)}
                  </td>
                  <td className="py-1.5 px-2 font-semibold text-gray-900">{order.symbol}</td>
                  <td className="py-1.5 px-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      (order.typeDescription || order.type || "").toString().includes("BUY") || order.type === 0
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}>
                      {order.typeDescription || order.type}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-right text-gray-900">
                    {(order.volumeInitial || order.volume || 0).toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2 text-right text-gray-900">
                    {formatPrice(order.priceOpen || order.priceCurrent || order.price)}
                  </td>
                  <td className="py-1.5 px-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      (order.stateDescription || order.state || "").toString().toLowerCase().includes("fill")
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {order.stateDescription || order.state || "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length > 50 && (
            <p className="text-center text-xs text-gray-400 py-2">
              Showing 50 of {filteredOrders.length} orders
            </p>
          )}
        </div>
      )}
    </div>
  );
}
