"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/outline";

// Helper to format date
const formatDate = (date) => {
  return date.toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
  });
};

// Helper to get start of week (Monday)
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  // Convert Sunday (0) to 7, then subtract 1 to get days to subtract
  const diff = d.getDate() - ((day + 6) % 7);
  return new Date(d.setDate(diff));
};

// Helper to get week dates
const getWeekDates = (startDate) => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }
  return dates;
};

// Helper to get day name from date
const getDayName = (date) => {
  return date.toLocaleDateString("en-US", { weekday: "short" });
};

// Helper to get days in month (week starts on Monday)
const getDaysInMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  // Convert Sunday (0) to 7, then subtract 1 to get offset for Monday start
  const startingDayOfWeek = firstDay.getDay();
  const mondayOffset = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
  
  const days = [];
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < mondayOffset; i++) {
    days.push(null);
  }
  // Add all days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  return days;
};

export default function BehaviourHeatmapDatePicker({ 
  onDateChange,
  selectedDate,
  startDate: propStartDate,
  endDate: propEndDate,
  mode = "single", // "single" | "range"
  viewMode, 
  hideViewModeToggle,
  onViewModeChange
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Single mode state
  const [currentDate, setCurrentDate] = useState(selectedDate ? new Date(selectedDate) : new Date());
  
  // Range mode state
  const [startDate, setStartDate] = useState(propStartDate ? new Date(propStartDate) : new Date());
  const [endDate, setEndDate] = useState(propEndDate ? new Date(propEndDate) : new Date());
  const [hoverDate, setHoverDate] = useState(null);
  
  const [monthView, setMonthView] = useState(new Date(mode === "range" ? (propStartDate || new Date()) : (selectedDate || new Date())));
  const pickerRef = useRef(null);

  // Sync with props
  useEffect(() => {
    if (mode === "single") {
      if (selectedDate) {
        setCurrentDate(new Date(selectedDate));
        setMonthView(new Date(selectedDate));
      }
    } else {
      // For range mode, sync if props change
      if (propStartDate) {
        const newStart = new Date(propStartDate);
        setStartDate(prev => prev.getTime() === newStart.getTime() ? prev : newStart);
        setMonthView(prev => {
           // Only update month view if it's wildly different? 
           // Original code just reset it. Let's keep behavior but safe.
           return prev.getTime() === newStart.getTime() ? prev : newStart;
        });
      }
      if (propEndDate) {
        const newEnd = new Date(propEndDate);
        setEndDate(prev => prev && prev.getTime() === newEnd.getTime() ? prev : newEnd);
      }
    }
  }, [selectedDate, propStartDate, propEndDate, mode]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Navigate months
  const navigateMonth = (direction) => {
    const newMonth = new Date(monthView);
    newMonth.setMonth(monthView.getMonth() + direction);
    setMonthView(newMonth);
  };

  // Helper to check if a date is between start and end (inclusive)
  const isDateInRange = (date, start, end) => {
    if (!start || !end) return false;
    const d = date.getTime();
    const s = start.getTime();
    const e = end.getTime();
    return d >= Math.min(s, e) && d <= Math.max(s, e);
  };

  // Select date
  const handleDateSelect = (date) => {
    if (!date) return;

    if (mode === "single") {
      setCurrentDate(date);
      setMonthView(date);
      if (onDateChange) {
        onDateChange(date);
      }
      setIsOpen(false);
    } else {
      // Range mode selection logic
      if (!startDate || (startDate && endDate)) {
        // Start a new range
        setStartDate(date);
        setEndDate(null);
      } else {
        // Complete the range
        // Ensure start is before end
        const newStart = date < startDate ? date : startDate;
        const newEnd = date < startDate ? startDate : date;
        
        setStartDate(newStart);
        setEndDate(newEnd);
        
        if (onDateChange) {
          onDateChange({ start: newStart, end: newEnd });
        }
        setIsOpen(false);
      }
    }
  };

  const handleQuickRange = (rangeType) => {
    const end = new Date();
    const start = new Date();
    
    switch(rangeType) {
      case 'last7':
        start.setDate(end.getDate() - 6);
        break;
      case 'last14':
        start.setDate(end.getDate() - 13);
        break;
      case 'thisMonth':
        start.setDate(1);
        break;
      case 'lastMonth':
        start.setMonth(start.getMonth() - 1);
        start.setDate(1);
        end.setMonth(end.getMonth() - 1);
        // Set to last day of last month
        end.setMonth(end.getMonth() + 1);
        end.setDate(0); 
        break;
      case 'today':
      default:
        // Use default (today for both)
        break;
    }
    
    if (mode === "single") {
      handleDateSelect(end);
    } else {
        setStartDate(start);
        setEndDate(end);
        setMonthView(start); // View the start of the range
        if (onDateChange) {
          onDateChange({ start, end });
        }
        setIsOpen(false);
    }
  };

  const daysInMonth = getDaysInMonth(monthView);
  const weekDates = getWeekDates(getStartOfWeek(mode === "single" ? currentDate : startDate));

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  // Format displayed date
  const getDisplayDate = () => {
    if (mode === "single") return formatDate(currentDate);
    if (!startDate) return "Select Range";
    if (!endDate) return `${formatDate(startDate)} - ...`;
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  return (
    <div className="relative" ref={pickerRef}>
      {/* Date Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 hover:text-teal-800 px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 border border-teal-100 shadow-sm"
      >
        <CalendarIcon className="w-4 h-4" />
        <span className="text-xs">{getDisplayDate()}</span>
      </button>

      {/* Date Picker Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-50 p-4 w-80"
            style={{
              boxShadow: "0 0 20px rgba(0, 191, 166, 0.15), 0 10px 25px rgba(0, 0, 0, 0.1)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-700">
                {mode === "range" 
                  ? (!startDate || (startDate && endDate) ? "Select Start Date" : "Select End Date")
                  : "Select Date"}
              </h4>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close date picker"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Calendar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3 px-1">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-1.5 rounded-md hover:bg-teal-50 text-gray-400 hover:text-teal-600 transition-colors"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-1">
                  <select 
                    value={monthView.getMonth()}
                    onChange={(e) => {
                      const newDate = new Date(monthView);
                      newDate.setMonth(parseInt(e.target.value));
                      setMonthView(newDate);
                    }}
                    className="text-sm font-semibold text-gray-700 bg-transparent cursor-pointer focus:outline-none hover:text-teal-600"
                  >
                    {monthNames.map((name, i) => (
                      <option key={name} value={i}>{name}</option>
                    ))}
                  </select>
                  
                  <select
                    value={monthView.getFullYear()}
                    onChange={(e) => {
                      const newDate = new Date(monthView);
                      newDate.setFullYear(parseInt(e.target.value));
                      setMonthView(newDate);
                    }}
                    className="text-sm font-semibold text-gray-700 bg-transparent cursor-pointer focus:outline-none hover:text-teal-600"
                  >
                    {[...Array(5)].map((_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                </div>

                <button
                  onClick={() => navigateMonth(1)}
                  className="p-1.5 rounded-md hover:bg-teal-50 text-gray-400 hover:text-teal-600 transition-colors"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Day names */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-gray-400 py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1" onMouseLeave={() => setHoverDate(null)}>
                {daysInMonth.map((date, index) => {
                  if (!date) {
                    return <div key={index} className="aspect-square" />;
                  }
                  
                  let isSelected = false;
                  let isInRange = false;
                  
                  if (mode === "single") {
                    isSelected = date.toDateString() === currentDate.toDateString();
                  } else {
                    // Range mode logic
                    const dTime = date.getTime();
                    const sTime = startDate ? startDate.getTime() : 0;
                    const eTime = endDate ? endDate.getTime() : 0;
                    
                    // Exact start or end match
                    isSelected = (startDate && dTime === sTime) || (endDate && dTime === eTime);
                    
                    // In between start and end
                    if (startDate && endDate) {
                      isInRange = dTime > Math.min(sTime, eTime) && dTime < Math.max(sTime, eTime);
                    } else if (startDate && hoverDate) {
                       // Preview range on hover
                       const hTime = hoverDate.getTime();
                       isInRange = dTime > Math.min(sTime, hTime) && dTime < Math.max(sTime, hTime);
                       if (dTime === hTime) isSelected = true; // Highlight hover target
                    }
                  }

                  const isToday = date.toDateString() === new Date().toDateString();
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleDateSelect(date)}
                      onMouseEnter={() => mode === "range" && setHoverDate(date)}
                      className={`aspect-square text-xs rounded-md transition-all ${
                        isSelected
                          ? "bg-teal-500 text-white font-medium shadow-md shadow-teal-100"
                          : isInRange 
                            ? "bg-teal-50 text-teal-700" 
                            : isToday
                            ? "bg-teal-50 text-teal-600 font-medium"
                            : "text-gray-600 hover:bg-teal-50 hover:text-teal-700"
                      }`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick actions */}
            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickRange('today')}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium py-1.5 rounded-md hover:bg-teal-50 transition-colors"
              >
                Today
              </button>
              {mode === "range" && (
                <>
                  <button
                    onClick={() => handleQuickRange('last7')}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium py-1.5 rounded-md hover:bg-teal-50 transition-colors"
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => handleQuickRange('last14')}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium py-1.5 rounded-md hover:bg-teal-50 transition-colors"
                  >
                    Last 14 Days
                  </button>
                  <button
                    onClick={() => handleQuickRange('thisMonth')}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium py-1.5 rounded-md hover:bg-teal-50 transition-colors"
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => handleQuickRange('lastMonth')}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium py-1.5 rounded-md hover:bg-teal-50 transition-colors"
                  >
                    Last Month
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

