import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, startOfYear, endOfYear, 
  eachDayOfInterval, parseISO,
  isWithinInterval, startOfDay, differenceInDays,
  eachMonthOfInterval
} from 'date-fns';
import { supabase } from '../utils/supabase';

const VerticalCalendar: React.FC = () => {
  // NEW STATE: Tracks the selected year for filtering
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [bookings, setBookings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [durationFilter, setDurationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "On Service": return { bg: "#ecfdf5", text: "#065f46", border: "#10b981" };
      case "On Reservation": return { bg: "#eff6ff", text: "#1e40af", border: "#3b82f6" };
      default: return { bg: "#f9fafb", text: "#374151", border: "#d1d5db" };
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const statuses = ["On Service" , "On Reservation"];
        // Fetch all relevant bookings
        const { data, error } = await supabase
          .from("renter_booking")
          .select("*")
          .in("status", statuses)
          .is("deleted_at", null);
        if (error) throw error;
        setBookings(data || []);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    fetchBookings();
  }, []);

  const filteredData = useMemo(() => {
    return bookings.filter(b => {
      const start = b.start_date ? parseISO(b.start_date) : new Date();
      const end = b.end_date ? parseISO(b.end_date) : new Date();
      const duration = differenceInDays(end, start);

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        b.full_name?.toLowerCase().includes(searchLower) ||
        b.car_model?.toLowerCase().includes(searchLower) ||
        b.car_type?.toLowerCase().includes(searchLower) ||
        b.car_plate_number?.toLowerCase().includes(searchLower);
        b.car_color?.toLowerCase().includes(searchLower);
      
      const matchesDuration = durationFilter === 'all' || duration.toString() === durationFilter;
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;

      // NEW LOGIC: Filter bookings by the selected year
      const matchesYear = start.getFullYear() === selectedYear;

      return matchesSearch && matchesDuration && matchesStatus && matchesYear;
    });
  }, [bookings, searchTerm, durationFilter, statusFilter, selectedYear]);

  // Generate all months for the selected year
  const months = eachMonthOfInterval({
    start: startOfYear(new Date(selectedYear, 0, 1)),
    end: endOfYear(new Date(selectedYear, 0, 1))
  });

  const hasResults = filteredData.length > 0;
  const isFiltered = searchTerm !== '' || durationFilter !== 'all' || statusFilter !== 'all';

  return (
    <div style={styles.appContainer}>
      {/* Search & Multi-Filter Section */}
      <div style={styles.filterContainer}>
        <input 
          type="text" 
          placeholder="Search name, model, plate..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        <div style={styles.selectRow}>
          {/* YEAR FILTER DROPDOWN */}
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={styles.selectInput}
          >
            {[2025, 2026, 2027, 2028, 2029, 2030].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select 
            value={durationFilter} 
            onChange={(e) => setDurationFilter(e.target.value)}
            style={styles.selectInput}
          >
            <option value="all">Duration</option>
            {[1, 2, 3, 4, 5, 6, 7].map(num => (
              <option key={num} value={num.toString()}>{num} Day{num > 1 ? 's' : ''}</option>
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
        <h2 style={styles.monthLabel}>{selectedYear} Bookings</h2>
      </header>

      <div style={styles.timelineList}>
        {!hasResults && isFiltered ? (
          <div style={styles.fallbackContainer}>
             <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔍</div>
             <p style={styles.fallbackText}>No rentals found matching your filters.</p>
             <button onClick={() => {setSearchTerm(''); setDurationFilter('all'); setStatusFilter('all');}} style={styles.resetBtn}>Reset All Filters</button>
          </div>
        ) : (
          months.map(month => {
            const daysInMonth = eachDayOfInterval({
              start: startOfMonth(month),
              end: endOfMonth(month)
            });

            // Only render months that have filtered events to save space
            if (isFiltered && !daysInMonth.some(day => filteredData.some(b => isWithinInterval(startOfDay(day), {start: startOfDay(parseISO(b.start_date)), end: startOfDay(parseISO(b.end_date))})))) return null;

            return (
              <div key={month.toString()} style={styles.monthSection}>
                <div style={styles.monthTitle}>{format(month, 'MMMM')}</div>
                
                {daysInMonth.map(day => {
                  const dayEvents = filteredData.filter(b => {
                    const start = startOfDay(parseISO(b.start_date));
                    const end = startOfDay(parseISO(b.end_date));
                    return isWithinInterval(startOfDay(day), { start, end });
                  });

                  if (isFiltered && dayEvents.length === 0) return null;

                  return (
                    <div key={day.toString()} style={styles.daySection}>
                      <div style={styles.leftLineArea}>
                        <div style={styles.dot} />
                        <div style={styles.connectorLine} />
                      </div>

                      <div style={styles.rightContentArea}>
                        <div style={styles.dateHeader}>
                          <span style={styles.dateNum}>{format(day, 'd')}</span>
                          <span style={styles.dayName}>{format(day, 'EEEE')}</span>
                        </div>

                        <div style={styles.eventStack}>
                          {dayEvents.map(event => {
                            const style = getStatusStyles(event.status);
                            const duration = differenceInDays(parseISO(event.end_date), parseISO(event.start_date));

                            return (
                              <div key={event.id} style={{ ...styles.portraitCard, backgroundColor: style.bg, borderLeft: `6px solid ${style.border}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <span style={{ fontWeight: '700', color: style.text, fontSize: '1.1rem' }}>{event.full_name}</span>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: style.text }}>
                                    {format(parseISO(event.start_date), 'MMM d')} - {format(parseISO(event.end_date), 'MMM d, yyyy')}
                                  </span>
                                </div>
                                
                                <div style={{ fontSize: '1rem', color: style.text, marginTop: '8px' }}>
                                  <p><strong>{event.car_type}</strong></p>
                                  🚗 <strong>{event.car_model}</strong> - <strong>{event.car_plate_number}</strong>
                                  <p><strong>{event.car_color}</strong></p>
                                  
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', alignItems: 'center' }}>
                                  <div style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', backgroundColor: style.border, color: '#fff', fontWeight: 'bold' }}>
                                    {event.status}
                                  </div>
                                  <div style={{ fontSize: '0.85rem', color: style.text, fontWeight: '700' }}>{duration} Day/s</div>
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

// --- Helper Functions ---
function startOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function endOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth() + 1, 0); }

// --- Styles ---
const styles: { [key: string]: React.CSSProperties } = {
  appContainer: { background: '#ffffff', minHeight: '100vh', width: '100%' },
  filterContainer: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px', background: '#fff', borderBottom: '1px solid #f3f4f6' },
  searchInput: { padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '1rem' },
  selectRow: { display: 'flex', gap: '10px' },
  selectInput: { flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '0.9rem' },
  navHeader: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
  monthLabel: { fontSize: '1.4rem', fontWeight: '800', margin: 0 },
  timelineList: { width: '100%' },
  monthSection: { width: '100%' },
  monthTitle: { fontSize: '1.8rem', fontWeight: '900', padding: '20px 20px 0', color: '#111827', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
  daySection: { display: 'flex', width: '100%', padding: '25px 20px 0', borderBottom: '1px solid #f3f4f6', boxSizing: 'border-box' },
  leftLineArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30px' },
  dot: { width: '10px', height: '10px', background: '#d1d5db', borderRadius: '50%', marginTop: '15px' },
  connectorLine: { flex: 1, width: '2px', background: '#f3f4f6' },
  rightContentArea: { flex: 1, paddingBottom: '30px' },
  dateHeader: { display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '15px' },
  dateNum: { fontSize: '2rem', fontWeight: '900' },
  dayName: { color: '#6b7280', fontSize: '1rem' },
  eventStack: { display: 'flex', flexDirection: 'column', gap: '15px' },
  portraitCard: { padding: '20px', borderRadius: '16px', width: '100%', boxSizing: 'border-box' },
  fallbackContainer: { padding: '80px 20px', textAlign: 'center' },
  fallbackText: { color: '#6b7280', fontSize: '1.1rem', marginBottom: '20px' },
  resetBtn: { padding: '10px 20px', background: '#111827', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};

export default VerticalCalendar;