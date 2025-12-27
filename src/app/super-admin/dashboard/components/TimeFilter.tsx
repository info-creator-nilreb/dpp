"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

type TimeRange = "today" | "30days" | "1year" | "custom";

interface TimeFilterProps {
  onRangeChange?: (range: TimeRange, startDate?: Date, endDate?: Date) => void;
}

/**
 * Global Time Filter Component
 * 
 * Affects ONLY Systemüberblick KPIs
 * Persists selection in URL params
 */
export default function TimeFilter({ onRangeChange }: TimeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get initial range from URL or default to "30days"
  const urlRange = searchParams.get("range") as TimeRange | null;
  const [selectedRange, setSelectedRange] = useState<TimeRange>(urlRange || "30days");
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  // Initialize from URL on mount
  useEffect(() => {
    const urlStart = searchParams.get("start");
    const urlEnd = searchParams.get("end");
    if (urlStart && urlEnd) {
      setCustomStart(urlStart);
      setCustomEnd(urlEnd);
      setSelectedRange("custom");
      setShowCustomPicker(true);
    }
  }, []);

  useEffect(() => {
    // Update URL when range changes
    const params = new URLSearchParams(searchParams.toString());
    
    if (selectedRange === "custom") {
      if (customStart && customEnd) {
        params.set("range", "custom");
        params.set("start", customStart);
        params.set("end", customEnd);
      } else {
        // Don't update URL if custom dates not set
        return;
      }
    } else {
      params.set("range", selectedRange);
      params.delete("start");
      params.delete("end");
    }
    
    router.push(`/super-admin/dashboard?${params.toString()}`, { scroll: false });
    
    // Calculate dates and notify parent
    if (onRangeChange) {
      const { startDate, endDate } = getDateRange(selectedRange, customStart, customEnd);
      onRangeChange(selectedRange, startDate, endDate);
    }
  }, [selectedRange, customStart, customEnd]);

  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range);
    if (range !== "custom") {
      setShowCustomPicker(false);
    } else {
      setShowCustomPicker(true);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        marginBottom: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "nowrap",
          alignItems: "center",
          gap: "0.5rem",
          width: "100%",
          boxSizing: "border-box",
          overflowX: "auto",
          overflowY: "hidden",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "thin",
        }}
        className="time-filter-container"
      >
        <style jsx>{`
          .time-filter-container::-webkit-scrollbar {
            height: 4px;
          }
          .time-filter-container::-webkit-scrollbar-track {
            background: #F5F5F5;
          }
          .time-filter-container::-webkit-scrollbar-thumb {
            background: #CDCDCD;
            border-radius: 2px;
          }
          @media (max-width: 640px) {
            .time-filter-container {
              flexWrap: wrap !important;
            }
          }
        `}</style>
        <div style={{ 
          display: "flex", 
          flexWrap: "nowrap",
          gap: "0.5rem", 
          alignItems: "center",
          flex: 1,
          minWidth: 0,
          width: "100%",
        }}>
          <button
            type="button"
            onClick={() => handleRangeChange("today")}
            style={{
              padding: "clamp(0.5rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)",
              border: "1px solid #D1D5DB",
              borderRadius: "6px",
              backgroundColor: selectedRange === "today" ? "#E20074" : "#FFFFFF",
              color: selectedRange === "today" ? "#FFFFFF" : "#374151",
              cursor: "pointer",
              fontSize: "clamp(0.8rem, 2vw, 0.875rem)",
              fontWeight: selectedRange === "today" ? "600" : "400",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Heute
          </button>
          <button
            type="button"
            onClick={() => handleRangeChange("30days")}
            style={{
              padding: "clamp(0.5rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)",
              border: "1px solid #D1D5DB",
              borderRadius: "6px",
              backgroundColor: selectedRange === "30days" ? "#E20074" : "#FFFFFF",
              color: selectedRange === "30days" ? "#FFFFFF" : "#374151",
              cursor: "pointer",
              fontSize: "clamp(0.8rem, 2vw, 0.875rem)",
              fontWeight: selectedRange === "30days" ? "600" : "400",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Letzte 30 Tage
          </button>
          <button
            type="button"
            onClick={() => handleRangeChange("1year")}
            style={{
              padding: "clamp(0.5rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)",
              border: "1px solid #D1D5DB",
              borderRadius: "6px",
              backgroundColor: selectedRange === "1year" ? "#E20074" : "#FFFFFF",
              color: selectedRange === "1year" ? "#FFFFFF" : "#374151",
              cursor: "pointer",
              fontSize: "clamp(0.8rem, 2vw, 0.875rem)",
              fontWeight: selectedRange === "1year" ? "600" : "400",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Letztes Jahr
          </button>
          <button
            type="button"
            onClick={() => handleRangeChange("custom")}
            style={{
              padding: "clamp(0.5rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)",
              border: "1px solid #D1D5DB",
              borderRadius: "6px",
              backgroundColor: selectedRange === "custom" ? "#E20074" : "#FFFFFF",
              color: selectedRange === "custom" ? "#FFFFFF" : "#374151",
              cursor: "pointer",
              fontSize: "clamp(0.8rem, 2vw, 0.875rem)",
              fontWeight: selectedRange === "custom" ? "600" : "400",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
              style={{ flexShrink: 0 }}
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span className="time-filter-custom-text">
              Benutzerdefiniert
            </span>
            <style jsx>{`
              @media (max-width: 640px) {
                .time-filter-custom-text {
                  display: none;
                }
              }
            `}</style>
          </button>
        </div>
      </div>

      {showCustomPicker && (
        <div style={{ 
          display: "flex", 
          flexWrap: "wrap",
          gap: "0.5rem", 
          alignItems: "center",
          padding: "0.75rem",
          backgroundColor: "#F9FAFB",
          borderRadius: "8px",
          border: "1px solid #E5E7EB",
        }}>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            style={{
              padding: "clamp(0.5rem, 1.5vw, 0.5rem)",
              border: "1px solid #D1D5DB",
              borderRadius: "6px",
              fontSize: "clamp(0.8rem, 2vw, 0.875rem)",
              flex: 1,
              minWidth: "140px",
              boxSizing: "border-box",
            }}
          />
          <span style={{ color: "#7A7A7A", fontSize: "clamp(0.8rem, 2vw, 0.875rem)" }}>bis</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            style={{
              padding: "clamp(0.5rem, 1.5vw, 0.5rem)",
              border: "1px solid #D1D5DB",
              borderRadius: "6px",
              fontSize: "clamp(0.8rem, 2vw, 0.875rem)",
              flex: 1,
              minWidth: "140px",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Calculate date range based on selection
 */
export function getDateRange(
  range: TimeRange,
  customStart?: string,
  customEnd?: string
): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  let startDate = new Date();

  switch (range) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "30days":
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "1year":
      startDate.setFullYear(startDate.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "custom":
      if (customStart && customEnd) {
        startDate = new Date(customStart);
        startDate.setHours(0, 0, 0, 0);
        endDate.setTime(new Date(customEnd).getTime());
        endDate.setHours(23, 59, 59, 999);
      }
      break;
  }

  return { startDate, endDate };
}

