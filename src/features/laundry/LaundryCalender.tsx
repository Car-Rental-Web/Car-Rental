import React, { useState, useEffect, useMemo } from "react";
import {
  format,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  parseISO,
  isWithinInterval,
  startOfDay,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { toast } from "react-toastify";
import { supabaseLaundry as supabase } from "../../utils/supabase";
import { to12Hour } from "../../utils/timeFormatter";
import type { LaundryBookingData } from "./components/ServiceBookingForm";

// Only bookings that are still ahead or in progress show on the calendar
const ACTIVE_STATUSES = ["On Service", "On Reservation"];

const getStatusStyles = (status: string | null) => {
  switch (status) {
    case "On Service":
      return { bg: "#ecfdf5", text: "#065f46", border: "#10b981" };
    case "On Reservation":
      return { bg: "#eff6ff", text: "#1e40af", border: "#3b82f6" };
    default:
      return { bg: "#f9fafb", text: "#374151", border: "#d1d5db" };
  }
};

const LaundryCalendar: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [bookings, setBookings] = useState<LaundryBookingData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Last year up to 4 years ahead, so the list never goes out of date
  const yearOptions = useMemo(
    () => Array.from({ length: 6 }, (_, i) => currentYear - 1 + i),
    [currentYear],
  );

  useEffect(() => {
    const fetchBookings = async () => {
      const { data, error } = await supabase
        .from("laundry_booking")
        .select("*")
        .in("status", ACTIVE_STATUSES)
        .order("start_date", { ascending: true });

      if (error) {
        console.error("laundry_booking error:", error);
        toast.error(`Error fetching bookings: ${error.message}`);
        return;
      }
      setBookings(data || []);
    };
    fetchBookings();
  }, []);

  // Services that actually have bookings, for the filter dropdown
  const serviceOptions = useMemo(() => {
    const names = bookings
      .map((b) => b.laundry_service)
      .filter((n): n is string => Boolean(n));
    return Array.from(new Set(names)).sort();
  }, [bookings]);

  const filteredData = useMemo(() => {
    const q = searchTerm.toLowerCase();

    return bookings.filter((b) => {
      // Skip rows that can't be placed on a calendar
      if (!b.start_date || !b.end_date) return false;

      const start = parseISO(b.start_date);
      const end = parseISO(b.end_date);
      if (end < start) return false;

      const matchesSearch =
        !q ||
        [
          b.full_name,
          b.laundry_service,
          b.machine_name,
          b.type_of_service,
          b.phone_number,
          b.address,
        ].some((v) => v?.toLowerCase().includes(q));

      const matchesService =
        serviceFilter === "all" || b.laundry_service === serviceFilter;
      const matchesStatus = statusFilter === "all" || b.status === statusFilter;

      // Shows in the year if any part of the booking falls inside it
      const matchesYear =
        start.getFullYear() <= selectedYear && end.getFullYear() >= selectedYear;

      return matchesSearch && matchesService && matchesStatus && matchesYear;
    });
  }, [bookings, searchTerm, serviceFilter, statusFilter, selectedYear]);

  // All months of the selected year
  const months = eachMonthOfInterval({
    start: startOfYear(new Date(selectedYear, 0, 1)),
    end: endOfYear(new Date(selectedYear, 0, 1)),
  });

  const hasResults = filteredData.length > 0;
  const isFiltered =
    searchTerm !== "" || serviceFilter !== "all" || statusFilter !== "all";

  const bookingsOnDay = (day: Date) =>
    filteredData.filter((b) =>
      isWithinInterval(startOfDay(day), {
        start: startOfDay(parseISO(b.start_date as string)),
        end: startOfDay(parseISO(b.end_date as string)),
      }),
    );

  return (
    <div style={styles.appContainer}>
      <div style={styles.filterContainer}>
        <input
          type="text"
          placeholder="Search name, service, phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        <div style={styles.selectRow}>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={styles.selectInput}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            style={styles.selectInput}
          >
            <option value="all">All Services</option>
            {serviceOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.selectInput}
          >
            <option value="all">Status</option>
            <option value="On Service">On Service</option>
            <option value="On Reservation">On Reservation</option>
          </select>
        </div>
      </div>

      <header style={styles.navHeader}>
        <h2 style={styles.monthLabel}>
          {selectedYear} Bookings ({filteredData.length})
        </h2>
      </header>

      <div style={styles.timelineList}>
        {!hasResults && isFiltered ? (
          <div style={styles.fallbackContainer}>
            <div style={{ fontSize: "3rem", marginBottom: "10px" }}>🔍</div>
            <p style={styles.fallbackText}>
              No bookings found matching your filters.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setServiceFilter("all");
                setStatusFilter("all");
              }}
              style={styles.resetBtn}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          months.map((month) => {
            const daysInMonth = eachDayOfInterval({
              start: startOfMonth(month),
              end: endOfMonth(month),
            });

            // When filtering, only render months that have bookings
            if (isFiltered && !daysInMonth.some((day) => bookingsOnDay(day).length > 0))
              return null;

            return (
              <div key={month.toString()} style={styles.monthSection}>
                <div style={styles.monthTitle}>{format(month, "MMMM")}</div>

                {daysInMonth.map((day) => {
                  const dayEvents = bookingsOnDay(day);

                  if (isFiltered && dayEvents.length === 0) return null;

                  return (
                    <div key={day.toString()} style={styles.daySection}>
                      <div style={styles.leftLineArea}>
                        <div style={styles.dot} />
                        <div style={styles.connectorLine} />
                      </div>

                      <div style={styles.rightContentArea}>
                        <div style={styles.dateHeader}>
                          <span style={styles.dateNum}>{format(day, "d")}</span>
                          <span style={styles.dayName}>
                            {format(day, "EEEE")}
                          </span>
                        </div>

                        <div style={styles.eventStack}>
                          {dayEvents.map((event) => {
                            const style = getStatusStyles(event.status);

                            return (
                              <div
                                key={event.id}
                                style={{
                                  ...styles.portraitCard,
                                  backgroundColor: style.bg,
                                  borderLeft: `6px solid ${style.border}`,
                                }}
                              >
                                {/* Customer + date range */}
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: "700",
                                      color: style.text,
                                      fontSize: "1.1rem",
                                    }}
                                  >
                                    {event.full_name}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "0.85rem",
                                      fontWeight: "bold",
                                      color: style.text,
                                    }}
                                  >
                                    {format(
                                      parseISO(event.start_date as string),
                                      "MMM d",
                                    )}{" "}
                                    -{" "}
                                    {format(
                                      parseISO(event.end_date as string),
                                      "MMM d, yyyy",
                                    )}
                                  </span>
                                </div>

                                {/* Service details */}
                                <div
                                  style={{
                                    fontSize: "1rem",
                                    color: style.text,
                                    marginTop: "8px",
                                  }}
                                >
                                  <p>
                                    <strong>{event.type_of_service}</strong>
                                  </p>
                                  <p>
                                    🧺 <strong>{event.laundry_service}</strong>
                                  </p>
                                  <p>
                                    ⚙️ <strong>{event.machine_name || "No Machine"}</strong>
                                  </p>
                                  {event.phone_number && (
                                    <p>📞 {event.phone_number}</p>
                                  )}
                                  {event.address && <p>📍 {event.address}</p>}
                                </div>

                                {/* Status + times */}
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginTop: "10px",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: "0.75rem",
                                      padding: "4px 8px",
                                      borderRadius: "6px",
                                      backgroundColor: style.border,
                                      color: "#fff",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {event.status}
                                  </div>

                                  <div>
                                    <div
                                      style={{
                                        fontSize: "0.85rem",
                                        color: style.text,
                                        fontWeight: "700",
                                      }}
                                    >
                                      Start:{" "}
                                      {event.start_time
                                        ? to12Hour(event.start_time)
                                        : "--"}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "0.85rem",
                                        color: style.text,
                                        fontWeight: "700",
                                      }}
                                    >
                                      End:{" "}
                                      {event.end_time
                                        ? to12Hour(event.end_time)
                                        : "--"}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "0.85rem",
                                        color: style.text,
                                        fontWeight: "700",
                                      }}
                                    >
                                      {event.duration || "—"}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// --- Styles ---
const styles: { [key: string]: React.CSSProperties } = {
  appContainer: { background: "#ffffff", minHeight: "100vh", width: "100%" },
  filterContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "20px",
    background: "#fff",
    borderBottom: "1px solid #f3f4f6",
  },
  searchInput: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    outline: "none",
    fontSize: "1rem",
  },
  selectRow: { display: "flex", gap: "10px" },
  selectInput: {
    flex: 1,
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontSize: "0.9rem",
  },
  navHeader: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },
  monthLabel: { fontSize: "1.4rem", fontWeight: "800", margin: 0 },
  timelineList: { width: "100%" },
  monthSection: { width: "100%" },
  monthTitle: {
    fontSize: "1.8rem",
    fontWeight: "900",
    padding: "20px 20px 0",
    color: "#111827",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
  },
  daySection: {
    display: "flex",
    width: "100%",
    padding: "25px 20px 0",
    borderBottom: "1px solid #f3f4f6",
    boxSizing: "border-box",
  },
  leftLineArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "30px",
    pointerEvents: "none",
  },
  dot: {
    width: "10px",
    height: "10px",
    background: "#d1d5db",
    borderRadius: "50%",
    marginTop: "15px",
  },
  connectorLine: { flex: 1, width: "2px", background: "#f3f4f6" },
  rightContentArea: { flex: 1, paddingBottom: "30px" },
  dateHeader: {
    display: "flex",
    alignItems: "baseline",
    gap: "10px",
    marginBottom: "15px",
  },
  dateNum: { fontSize: "2rem", fontWeight: "900" },
  dayName: { color: "#6b7280", fontSize: "1rem" },
  eventStack: { display: "flex", flexDirection: "column", gap: "15px" },
  portraitCard: {
    padding: "20px",
    borderRadius: "16px",
    width: "100%",
    boxSizing: "border-box",
  },
  fallbackContainer: { padding: "80px 20px", textAlign: "center" },
  fallbackText: { color: "#6b7280", fontSize: "1.1rem", marginBottom: "20px" },
  resetBtn: {
    padding: "10px 20px",
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default LaundryCalendar;