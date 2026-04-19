"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useTrades, useTradeActions } from "@/app/hooks/useTrades";
import LoadingSpinner from "@/components/LoadingSpinner";
import Toast from "@/components/Toast";
import GlassmorphicButton from "@/components/GlassmorphicButton";

export default function TradesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportJson, setBulkImportJson] = useState("");
  const [bulkImportErrors, setBulkImportErrors] = useState([]);
  const [selectedTrades, setSelectedTrades] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [formData, setFormData] = useState({
    entryTime: "",
    exitTime: "",
    riskPercentUsed: "",
    profitLoss: "",
    riskRewardAchieved: "",
    session: "LONDON",
    stopLossHit: false,
    exitedEarly: false,
    targetPercentAchieved: "",
    notes: "",
  });

  const {
    data: tradesData,
    loading: tradesLoading,
    refetch,
  } = useTrades({
    page: currentPage,
    limit: pageSize,
  });
  const {
    createTrade,
    updateTrade,
    deleteTrade,
    deleteTradesBulk,
    bulkImport,
    loading: actionLoading,
  } = useTradeActions();

  const trades = tradesData?.results || tradesData || [];
  const totalResults = tradesData?.totalResults || 0;
  const totalPages = tradesData?.totalPages || 1;
  const currentPageFromAPI = tradesData?.page || currentPage;
  const limitFromAPI = tradesData?.limit || pageSize;

  // Update current page if API returned different page (e.g., after deletion)
  useEffect(() => {
    if (
      currentPageFromAPI !== currentPage &&
      currentPageFromAPI > 0 &&
      !tradesLoading
    ) {
      setCurrentPage(currentPageFromAPI);
    }
  }, [currentPageFromAPI, tradesLoading]);

  const hasNext = currentPage < totalPages;
  const hasPrevious = currentPage > 1;

  useEffect(() => {
    if (editingTrade) {
      setFormData({
        entryTime: editingTrade.entryTime
          ? new Date(editingTrade.entryTime).toISOString().slice(0, 16)
          : "",
        exitTime: editingTrade.exitTime
          ? new Date(editingTrade.exitTime).toISOString().slice(0, 16)
          : "",
        riskPercentUsed: editingTrade.riskPercentUsed || "",
        profitLoss: editingTrade.profitLoss || "",
        riskRewardAchieved: editingTrade.riskRewardAchieved || "",
        session: editingTrade.session || "LONDON",
        stopLossHit: editingTrade.stopLossHit || false,
        exitedEarly: editingTrade.exitedEarly || false,
        targetPercentAchieved: editingTrade.targetPercentAchieved || "",
        notes: editingTrade.notes || "",
      });
      setShowForm(true);
    }
  }, [editingTrade]);

  // Clean up selected trades that no longer exist
  useEffect(() => {
    if (trades.length > 0) {
      const tradeIds = trades.map((trade) => trade.id);
      setSelectedTrades((prev) => {
        if (prev.length === 0) return prev;
        const validSelections = prev.filter((id) => tradeIds.includes(id));
        return validSelections.length !== prev.length ? validSelections : prev;
      });
    }
  }, [trades]);

  // Handle empty page after deletion - go back to previous page if current page is empty
  useEffect(() => {
    if (
      trades.length === 0 &&
      currentPage > 1 &&
      !tradesLoading &&
      totalPages > 0
    ) {
      // Only go back if we're not on the first page and there are no trades
      const targetPage = Math.max(1, totalPages);
      if (targetPage < currentPage) {
        setCurrentPage(targetPage);
      }
    }
  }, [trades.length, currentPage, tradesLoading, totalPages]);

  const resetForm = () => {
    setFormData({
      entryTime: "",
      exitTime: "",
      riskPercentUsed: "",
      profitLoss: "",
      riskRewardAchieved: "",
      session: "LONDON",
      stopLossHit: false,
      exitedEarly: false,
      targetPercentAchieved: "",
      notes: "",
    });
    setEditingTrade(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const tradeData = {
        entryTime: new Date(formData.entryTime).toISOString(),
        exitTime: new Date(formData.exitTime).toISOString(),
        riskPercentUsed: parseFloat(formData.riskPercentUsed),
        profitLoss: parseFloat(formData.profitLoss),
        riskRewardAchieved: parseFloat(formData.riskRewardAchieved),
        session: formData.session,
        stopLossHit: formData.stopLossHit,
        exitedEarly: formData.exitedEarly,
        targetPercentAchieved: parseFloat(formData.targetPercentAchieved),
        notes: formData.notes || undefined,
      };

      if (editingTrade) {
        await updateTrade(editingTrade.id, tradeData);
        setToast({
          show: true,
          message: "Trade updated successfully!",
          type: "success",
        });
      } else {
        await createTrade(tradeData);
        setToast({
          show: true,
          message: "Trade created successfully!",
          type: "success",
        });
      }

      resetForm();
      refetch();
      // Reset to first page after creating/updating
      setCurrentPage(1);
    } catch (error) {
      setToast({
        show: true,
        message: error.message || "Failed to save trade",
        type: "error",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this trade?")) return;

    try {
      await deleteTrade(id);
      setToast({
        show: true,
        message: "Trade deleted successfully!",
        type: "success",
      });
      // Remove from selection if it was selected
      setSelectedTrades(selectedTrades.filter((tradeId) => tradeId !== id));

      // If this was the last item on the page and not page 1, go to previous page
      const wasLastItemOnPage = trades.length === 1;
      if (wasLastItemOnPage && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        await refetch();
        // After refetch, if current page is empty and not page 1, go back
        // This will be handled by the next render cycle
      }
    } catch (error) {
      setToast({
        show: true,
        message: error.message || "Failed to delete trade",
        type: "error",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTrades.length === 0) return;

    const confirmMessage = `Are you sure you want to delete ${
      selectedTrades.length
    } trade${selectedTrades.length > 1 ? "s" : ""}?`;
    if (!confirm(confirmMessage)) return;

    try {
      await deleteTradesBulk(selectedTrades);
      
      setToast({
        show: true,
        message: `Successfully deleted ${selectedTrades.length} trade${
          selectedTrades.length > 1 ? "s" : ""
        }!`,
        type: "success",
      });

      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setToast({ show: false, message: "", type: "success" });
      }, 5000);

      setSelectedTrades([]);
      refetch();
    } catch (error) {
      setToast({
        show: true,
        message: error.message || "Failed to delete trades",
        type: "error",
      });
    }
  };

  const handleSelectTrade = (id) => {
    setSelectedTrades((prev) =>
      prev.includes(id)
        ? prev.filter((tradeId) => tradeId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTrades(trades.map((trade) => trade.id));
    } else {
      setSelectedTrades([]);
    }
  };

  const validateTrade = (trade, index) => {
    const errors = [];
    const requiredFields = [
      "entryTime",
      "exitTime",
      "riskPercentUsed",
      "profitLoss",
      "riskRewardAchieved",
      "session",
      "stopLossHit",
      "exitedEarly",
      "targetPercentAchieved",
    ];

    // Check required fields
    requiredFields.forEach((field) => {
      if (trade[field] === undefined || trade[field] === null) {
        errors.push(`Trade ${index + 1}: Missing required field "${field}"`);
      }
    });

    // Validate entryTime
    if (trade.entryTime) {
      const entryDate = new Date(trade.entryTime);
      if (isNaN(entryDate.getTime())) {
        errors.push(`Trade ${index + 1}: Invalid entryTime format`);
      }
    }

    // Validate exitTime
    if (trade.exitTime) {
      const exitDate = new Date(trade.exitTime);
      if (isNaN(exitDate.getTime())) {
        errors.push(`Trade ${index + 1}: Invalid exitTime format`);
      } else if (trade.entryTime) {
        const entryDate = new Date(trade.entryTime);
        if (exitDate < entryDate) {
          errors.push(`Trade ${index + 1}: exitTime must be after entryTime`);
        }
      }
    }

    // Validate riskPercentUsed
    if (
      trade.riskPercentUsed !== undefined &&
      (typeof trade.riskPercentUsed !== "number" || trade.riskPercentUsed < 0)
    ) {
      errors.push(`Trade ${index + 1}: riskPercentUsed must be a number >= 0`);
    }

    // Validate profitLoss
    if (
      trade.profitLoss !== undefined &&
      typeof trade.profitLoss !== "number"
    ) {
      errors.push(`Trade ${index + 1}: profitLoss must be a number`);
    }

    // Validate riskRewardAchieved
    if (
      trade.riskRewardAchieved !== undefined &&
      typeof trade.riskRewardAchieved !== "number"
    ) {
      errors.push(`Trade ${index + 1}: riskRewardAchieved must be a number`);
    }

    // Validate session
    const validSessions = ["LONDON", "NY", "ASIA"];
    if (trade.session !== undefined && !validSessions.includes(trade.session)) {
      errors.push(
        `Trade ${index + 1}: session must be one of: ${validSessions.join(
          ", "
        )}`
      );
    }

    // Validate stopLossHit
    if (
      trade.stopLossHit !== undefined &&
      typeof trade.stopLossHit !== "boolean"
    ) {
      errors.push(`Trade ${index + 1}: stopLossHit must be a boolean`);
    }

    // Validate exitedEarly
    if (
      trade.exitedEarly !== undefined &&
      typeof trade.exitedEarly !== "boolean"
    ) {
      errors.push(`Trade ${index + 1}: exitedEarly must be a boolean`);
    }

    // Validate targetPercentAchieved
    if (
      trade.targetPercentAchieved !== undefined &&
      (typeof trade.targetPercentAchieved !== "number" ||
        trade.targetPercentAchieved < 0)
    ) {
      errors.push(
        `Trade ${index + 1}: targetPercentAchieved must be a number >= 0`
      );
    }

    return errors;
  };

  const validateBulkImportJson = (jsonText) => {
    const errors = [];
    let data;

    // Try to parse JSON
    try {
      data = JSON.parse(jsonText);
    } catch (error) {
      return [`Invalid JSON: ${error.message}`];
    }

    // Check if data is an object with trades array or just an array
    let trades = [];
    if (Array.isArray(data)) {
      trades = data;
    } else if (data.trades && Array.isArray(data.trades)) {
      trades = data.trades;
    } else {
      return [
        "Invalid format. Expected either an array of trades or an object with a 'trades' property containing an array.",
      ];
    }

    if (trades.length === 0) {
      return ["No trades found in the data."];
    }

    // Validate each trade
    trades.forEach((trade, index) => {
      const tradeErrors = validateTrade(trade, index);
      errors.push(...tradeErrors);
    });

    return errors;
  };

  const handleBulkImportFromFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const errors = validateBulkImportJson(text);

      if (errors.length > 0) {
        setBulkImportErrors(errors);
        return;
      }

      const data = JSON.parse(text);
      const trades = data.trades || data;
      await bulkImport(trades);
      setToast({
        show: true,
        message: `${trades.length} trades imported successfully!`,
        type: "success",
      });
      setShowBulkImport(false);
      setBulkImportJson("");
      setBulkImportErrors([]);
      refetch();
      // Reset to first page after importing
      setCurrentPage(1);
    } catch (error) {
      setToast({
        show: true,
        message: error.message || "Failed to import trades",
        type: "error",
      });
    }
  };

  const handleBulkImportFromText = async () => {
    if (!bulkImportJson.trim()) {
      setBulkImportErrors(["Please paste or enter JSON data"]);
      return;
    }

    const errors = validateBulkImportJson(bulkImportJson);
    setBulkImportErrors(errors);

    if (errors.length > 0) {
      return;
    }

    try {
      const data = JSON.parse(bulkImportJson);
      const trades = data.trades || data;
      await bulkImport(trades);
      setToast({
        show: true,
        message: `${trades.length} trades imported successfully!`,
        type: "success",
      });
      // Auto-hide toast after 3 seconds
      setTimeout(() => {
        setToast({ show: false, message: "", type: "success" });
      }, 3000);
      setShowBulkImport(false);
      setBulkImportJson("");
      setBulkImportErrors([]);
      refetch();
      // Reset to first page after importing
      setCurrentPage(1);
    } catch (error) {
      setToast({
        show: true,
        message: error.message || "Failed to import trades",
        type: "error",
      });
      // Auto-hide toast after 3 seconds
      setTimeout(() => {
        setToast({ show: false, message: "", type: "error" });
      }, 3000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setSelectedTrades([]); // Clear selections when changing pages
      // Scroll to top of table
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
    setSelectedTrades([]); // Clear selections
  };

  return (
    <>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: "", type: "success" })}
      />

      <div className="min-h-screen mt-[108px] px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Trades</h1>
              <p className="text-gray-600 text-lg">
                Manage your trading history
              </p>
            </div>
            <div className="flex gap-3">
              {selectedTrades.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBulkDelete}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrashIcon className="w-5 h-5" />
                  Delete Selected ({selectedTrades.length})
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBulkImport(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all duration-300 flex items-center gap-2"
              >
                <ArrowUpTrayIcon className="w-5 h-5" />
                Bulk Import
              </motion.button>
              <GlassmorphicButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="px-4 py-2"
                icon={<PlusIcon className="w-5 h-5" />}
              >
                New Trade
              </GlassmorphicButton>
            </div>
          </div>
        </div>

        {/* Bulk Import Modal */}
        {showBulkImport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => {
              setShowBulkImport(false);
              setBulkImportJson("");
              setBulkImportErrors([]);
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-3xl w-full my-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Bulk Import Trades
                </h2>
                <button
                  onClick={() => {
                    setShowBulkImport(false);
                    setBulkImportJson("");
                    setBulkImportErrors([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Paste JSON Section */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste JSON Data
                </label>
                <textarea
                  value={bulkImportJson}
                  onChange={(e) => {
                    setBulkImportJson(e.target.value);
                    // Clear errors when user starts typing
                    if (bulkImportErrors.length > 0) {
                      setBulkImportErrors([]);
                    }
                  }}
                  onBlur={() => {
                    // Validate on blur
                    if (bulkImportJson.trim()) {
                      const errors = validateBulkImportJson(bulkImportJson);
                      setBulkImportErrors(errors);
                    }
                  }}
                  placeholder='Paste your JSON here. Example: { "trades": [...] } or just [ ... ]'
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                />
                {bulkImportJson.trim() && (
                  <div className="mt-2 text-sm text-gray-500">
                    {bulkImportJson.split("\n").length} lines
                  </div>
                )}
              </div>

              {/* Validation Errors */}
              {bulkImportErrors.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <XMarkIcon className="w-5 h-5 text-red-600" />
                    <h6 className="font-semibold text-red-800">
                      Validation Errors ({bulkImportErrors.length})
                    </h6>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700 max-h-40 overflow-y-auto">
                    {bulkImportErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Upload File Section */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or Upload JSON File
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleBulkImportFromFile}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
              </div>

              {/* Format Example */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                <p className="font-semibold mb-2">Expected format:</p>
                <pre className="text-xs overflow-auto max-h-48">
                  {JSON.stringify(
                    {
                      trades: [
                        {
                          entryTime: "2023-01-01T09:00:00Z",
                          exitTime: "2023-01-01T10:30:00Z",
                          riskPercentUsed: 2,
                          profitLoss: 150,
                          riskRewardAchieved: 1.5,
                          session: "LONDON",
                          stopLossHit: false,
                          exitedEarly: false,
                          targetPercentAchieved: 100,
                          notes: "Good trade",
                        },
                      ],
                    },
                    null,
                    2
                  )}
                </pre>
                <p className="mt-2 text-xs">
                  Note: You can also use a simple array format: [{"{...}"}]
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowBulkImport(false);
                    setBulkImportJson("");
                    setBulkImportErrors([]);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-all duration-300"
                >
                  Cancel
                </button>
                <GlassmorphicButton
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBulkImportFromText}
                  disabled={!bulkImportJson.trim() || actionLoading}
                  className="px-4 py-2"
                >
                  {actionLoading ? "Importing..." : "Import Trades"}
                </GlassmorphicButton>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Trade Form Modal */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto p-4"
            onClick={() => resetForm()}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-auto my-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingTrade ? "Edit Trade" : "New Trade"}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Entry Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.entryTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          entryTime: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Exit Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.exitTime}
                      onChange={(e) =>
                        setFormData({ ...formData, exitTime: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Risk % Used <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.riskPercentUsed}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          riskPercentUsed: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Profit/Loss ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.profitLoss}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          profitLoss: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Risk/Reward Achieved{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.riskRewardAchieved}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          riskRewardAchieved: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Session <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.session}
                      onChange={(e) =>
                        setFormData({ ...formData, session: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="LONDON">LONDON</option>
                      <option value="NY">NY</option>
                      <option value="ASIA">ASIA</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target % Achieved <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.targetPercentAchieved}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          targetPercentAchieved: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.stopLossHit}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              stopLossHit: e.target.checked,
                            })
                          }
                          className="mr-2 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Stop Loss Hit
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.exitedEarly}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              exitedEarly: e.target.checked,
                            })
                          }
                          className="mr-2 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Exited Early
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Additional notes about this trade..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <GlassmorphicButton
                    type="submit"
                    disabled={actionLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2"
                  >
                    {actionLoading
                      ? "Saving..."
                      : editingTrade
                      ? "Update Trade"
                      : "Create Trade"}
                  </GlassmorphicButton>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Trades List */}
        {tradesLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner className="w-12 h-12" />
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200">
            <p className="text-gray-600 text-lg mb-4">No trades found</p>
            <GlassmorphicButton
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-4 py-2 mx-auto"
              icon={<PlusIcon className="w-5 h-5" />}
            >
              Create Your First Trade
            </GlassmorphicButton>
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 relative"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow:
                "0 8px 32px 0 rgba(0, 0, 128, 0.15), 0 0 0 1px rgba(255,255,255,0.1) inset",
            }}
          >
            {/* Inner highlight */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            <div className="overflow-x-auto relative z-10">
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 100%)",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
                    }}
                  >
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={
                          trades.length > 0 &&
                          selectedTrades.length === trades.length
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Entry Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Exit Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Session
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Risk %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      P/L
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      R/R
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Target %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => (
                    <motion.tr
                      key={trade.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="transition-all duration-200"
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(255, 255, 255, 0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedTrades.includes(trade.id)}
                          onChange={() => handleSelectTrade(trade.id)}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(trade.entryTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(trade.exitTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {trade.session}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trade.riskPercentUsed}%
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          trade.profitLoss >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(trade.profitLoss)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trade.riskRewardAchieved?.toFixed(2) || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trade.targetPercentAchieved}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col gap-1">
                          {trade.stopLossHit && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              Stop Loss
                            </span>
                          )}
                          {trade.exitedEarly && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                              Exited Early
                            </span>
                          )}
                          {!trade.stopLossHit && !trade.exitedEarly && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Normal
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setEditingTrade(trade)}
                            className="text-primary hover:text-primary/80"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(trade.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {trades.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white/50">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700">Show:</label>
                    <select
                      value={pageSize}
                      onChange={(e) =>
                        handlePageSizeChange(Number(e.target.value))
                      }
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-gray-700">per page</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    {totalResults > 0 ? (
                      <>
                        Showing {(currentPage - 1) * pageSize + 1} to{" "}
                        {Math.min(currentPage * pageSize, totalResults)} of{" "}
                        {totalResults} trades
                      </>
                    ) : (
                      <>
                        Showing {(currentPage - 1) * pageSize + 1} to{" "}
                        {Math.min(
                          currentPage * pageSize,
                          (currentPage - 1) * pageSize + trades.length
                        )}{" "}
                        trades
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: hasPrevious ? 1.05 : 1 }}
                    whileTap={{ scale: hasPrevious ? 0.95 : 1 }}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!hasPrevious || currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                      hasPrevious && currentPage > 1
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-gray-50 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                    Previous
                  </motion.button>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <motion.button
                              key={pageNum}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                                currentPage === pageNum
                                  ? "bg-primary text-white"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {pageNum}
                            </motion.button>
                          );
                        }
                      )}
                    </div>
                  )}

                  {totalPages > 1 && (
                    <span className="text-sm text-gray-700 px-2">
                      Page {currentPage} of {totalPages}
                    </span>
                  )}

                  <motion.button
                    whileHover={{ scale: hasNext ? 1.05 : 1 }}
                    whileTap={{ scale: hasNext ? 0.95 : 1 }}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasNext || currentPage >= totalPages}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                      hasNext && currentPage < totalPages
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-gray-50 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Next
                    <ChevronRightIcon className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
