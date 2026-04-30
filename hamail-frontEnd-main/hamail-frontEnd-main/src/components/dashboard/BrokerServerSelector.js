"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { apiClient } from "@/utils/api";
import { ChevronDownIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

/**
 * BrokerServerSelector — searchable dropdown for selecting a broker and server.
 * Fetches broker list from GET /v1/brokers API.
 * Falls back to manual text input if API fails.
 *
 * Props:
 *   value: string — current server name
 *   onChange: (server: string) => void
 */
export default function BrokerServerSelector({ value = "", onChange }) {
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch brokers on mount
  useEffect(() => {
    async function loadBrokers() {
      try {
        const data = await apiClient.fetch("/brokers");
        const list = Array.isArray(data) ? data : data?.brokers || data?.results || [];
        setBrokers(list);
        setError(false);
      } catch (err) {
        console.error("Failed to load brokers:", err);
        setError(true);
        setManualMode(true);
      } finally {
        setLoading(false);
      }
    }
    loadBrokers();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter brokers by search
  const filtered = useMemo(() => {
    if (!search.trim()) return brokers.slice(0, 50); // Show first 50 when not searching
    const q = search.toLowerCase();
    return brokers
      .filter(
        (b) =>
          b.name?.toLowerCase().includes(q) ||
          b.display_name?.toLowerCase().includes(q) ||
          b.id?.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [brokers, search]);

  // Handle broker selection — fetch full broker details with servers
  const handleSelectBroker = async (broker) => {
    setSearch("");
    try {
      // Fetch full broker details including servers array
      const data = await apiClient.fetch(`/brokers/${broker.id}`);
      const fullBroker = data?.broker || data;
      setSelectedBroker(fullBroker);
      // If broker has only one server, auto-select it
      if (fullBroker.servers?.length === 1) {
        onChange(fullBroker.servers[0].name);
        setIsOpen(false);
      }
    } catch (err) {
      console.error("Failed to load broker servers:", err);
      // Fallback: use the lightweight broker object
      setSelectedBroker(broker);
    }
  };

  // Handle server selection
  const handleSelectServer = (serverName) => {
    onChange(serverName);
    setIsOpen(false);
    setSelectedBroker(null);
  };

  // Manual input mode (fallback)
  if (manualMode || error) {
    return (
      <div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          placeholder="e.g., ICMarketsSC-Live01"
        />
        {!loading && brokers.length > 0 && (
          <button
            type="button"
            onClick={() => setManualMode(false)}
            className="text-xs text-primary mt-1 hover:underline"
          >
            ← Browse broker list
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 text-sm flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-teal-500 rounded-full animate-spin" />
        Loading brokers...
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Display selected value or trigger */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSelectedBroker(null);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between hover:border-gray-400 transition-all focus:ring-2 focus:ring-primary focus:border-transparent"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value || "Select broker & server..."}
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Manual input toggle */}
      <button
        type="button"
        onClick={() => setManualMode(true)}
        className="text-xs text-gray-400 mt-1 hover:text-primary hover:underline"
      >
        Can't find your broker? Enter server manually →
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="p-2 border-b border-gray-100 flex items-center gap-2">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedBroker(null);
              }}
              className="flex-1 text-sm outline-none placeholder-gray-400"
              placeholder="Search broker or server..."
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="overflow-y-auto flex-1">
            {selectedBroker ? (
              /* Server list for selected broker */
              <div>
                <button
                  type="button"
                  onClick={() => setSelectedBroker(null)}
                  className="w-full text-left px-3 py-2 text-xs text-primary hover:bg-gray-50 border-b border-gray-100 flex items-center gap-1"
                >
                  ← Back to brokers
                </button>
                <div className="px-2 py-1 text-[10px] text-gray-400 uppercase tracking-wider">
                  {selectedBroker.name} — Select Server
                </div>
                {selectedBroker.servers?.length > 0 ? (
                  selectedBroker.servers.map((server, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectServer(server.name)}
                      className="w-full text-left px-3 py-2.5 hover:bg-teal-50 transition-colors flex items-center justify-between group"
                    >
                      <span className="text-sm text-gray-800 font-medium">{server.name}</span>
                      <span className="text-[10px] text-gray-400 uppercase">
                        {server.type || ""}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-4 text-sm text-gray-400 text-center">
                    No servers listed for this broker
                  </div>
                )}
              </div>
            ) : (
              /* Broker list */
              <>
                {filtered.length > 0 ? (
                  filtered.map((broker) => (
                    <button
                      key={broker.id}
                      type="button"
                      onClick={() => handleSelectBroker(broker)}
                      className="w-full text-left px-3 py-2.5 hover:bg-teal-50 transition-colors flex items-center justify-between group border-b border-gray-50 last:border-0"
                    >
                      <div>
                        <span className="text-sm text-gray-800 font-medium block">
                          {broker.name || broker.display_name}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {broker.server_count ?? broker.servers?.length ?? 0} server{(broker.server_count ?? broker.servers?.length ?? 0) !== 1 ? "s" : ""} • {broker.type || "broker"}
                        </span>
                      </div>
                      <ChevronDownIcon className="w-3 h-3 text-gray-300 -rotate-90 group-hover:text-teal-500" />
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-6 text-sm text-gray-400 text-center">
                    No brokers found for "{search}"
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
