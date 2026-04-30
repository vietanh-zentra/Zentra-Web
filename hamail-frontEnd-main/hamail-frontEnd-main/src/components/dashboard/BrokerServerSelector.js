"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { apiClient } from "@/utils/api";
import { ChevronDownIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

/**
 * BrokerServerSelector — combobox that works as both free-text input AND searchable dropdown.
 * - User can type server name directly (e.g. "Exness-MT5Real25") and it will be used as-is
 * - User can also browse/search brokers and pick a server from the dropdown
 * - Fetches broker list from GET /v1/brokers API
 */
export default function BrokerServerSelector({ value = "", onChange }) {
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fetch brokers on mount
  useEffect(() => {
    async function loadBrokers() {
      try {
        const data = await apiClient.fetch("/brokers");
        const list = Array.isArray(data) ? data : data?.brokers || data?.results || [];
        setBrokers(list);
      } catch (err) {
        console.error("Failed to load brokers:", err);
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
        setSelectedBroker(null);
        // Commit whatever is typed when clicking outside
        if (inputValue.trim() && inputValue !== value) {
          onChange(inputValue.trim());
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inputValue, value, onChange]);

  // Filter brokers by input (bidirectional match)
  const filtered = useMemo(() => {
    if (!inputValue.trim()) return brokers.slice(0, 50);
    const q = inputValue.toLowerCase();
    return brokers
      .filter((b) => {
        const name = b.name?.toLowerCase() || "";
        const displayName = b.display_name?.toLowerCase() || "";
        const id = b.id?.toLowerCase() || "";
        return (
          name.includes(q) || q.includes(name) ||
          displayName.includes(q) || q.includes(displayName) ||
          id.includes(q) || q.includes(id)
        );
      })
      .slice(0, 30);
  }, [brokers, inputValue]);

  // Handle typing in the input
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setSelectedBroker(null);
    if (!isOpen) setIsOpen(true);
    // Live update the parent value as user types
    onChange(val);
  };

  // Handle Enter key — commit the typed value and close
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        onChange(inputValue.trim());
      }
      setIsOpen(false);
      setSelectedBroker(null);
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      setSelectedBroker(null);
    }
  };

  // Handle broker selection — fetch full details with servers
  const handleSelectBroker = async (broker) => {
    try {
      const data = await apiClient.fetch(`/brokers/${broker.id}`);
      const fullBroker = data?.broker || data;
      setSelectedBroker(fullBroker);
      // If broker has only one server, auto-select it
      if (fullBroker.servers?.length === 1) {
        const serverName = fullBroker.servers[0].name;
        setInputValue(serverName);
        onChange(serverName);
        setIsOpen(false);
        setSelectedBroker(null);
      }
    } catch (err) {
      console.error("Failed to load broker servers:", err);
      setSelectedBroker(broker);
    }
  };

  // Handle server selection
  const handleSelectServer = (serverName) => {
    setInputValue(serverName);
    onChange(serverName);
    setIsOpen(false);
    setSelectedBroker(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Combobox input — works as both free-text and search */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-9 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          placeholder="Type server name or search broker..."
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setSelectedBroker(null);
            if (!isOpen) inputRef.current?.focus();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && !loading && brokers.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-hidden flex flex-col">
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
                  {selectedBroker.display_name || selectedBroker.name} — Select Server
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
                      <span className="text-[10px] text-gray-400 uppercase">{server.type || ""}</span>
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
                {/* Hint text */}
                {inputValue.trim() && (
                  <div className="px-3 py-1.5 text-[10px] text-gray-400 bg-gray-50 border-b border-gray-100">
                    Press Enter to use "<strong className="text-gray-600">{inputValue}</strong>" directly, or select a broker below
                  </div>
                )}
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
                          {broker.server_count ?? 0} server{(broker.server_count ?? 0) !== 1 ? "s" : ""} • {broker.type || "broker"}
                        </span>
                      </div>
                      <ChevronDownIcon className="w-3 h-3 text-gray-300 -rotate-90 group-hover:text-teal-500" />
                    </button>
                  ))
                ) : inputValue.trim() ? (
                  <div className="px-3 py-4 text-sm text-gray-400 text-center">
                    No matching brokers — press Enter to use "{inputValue}"
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isOpen && loading && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg p-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-teal-500 rounded-full animate-spin" />
            Loading brokers...
          </div>
        </div>
      )}
    </div>
  );
}
