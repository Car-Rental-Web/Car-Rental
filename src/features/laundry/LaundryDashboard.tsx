/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import icons from "../../constants/icon";
import { supabaseLaundry as supabase } from "../../utils/supabase";
import Card from "../../components/Card";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// "YYYY-MM-DD" for a date column
const toDateString = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;

// Supabase returns at most 1000 rows per request, so read all-time
// totals page by page to be sure nothing is cut off.
const fetchAllRows = async (makeQuery: () => any): Promise<any[]> => {
  const size = 1000;
  let from = 0;
  const rows: any[] = [];

  while (true) {
    const { data, error } = await makeQuery().range(from, from + size - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < size) break;
    from += size;
  }
  return rows;
};

/* ---------------- Small dependency-free charts ---------------- */

interface BarItem {
  label: string;
  value: number;
  color: string; // full Tailwind class, e.g. "bg-blue-500"
}

const StatusBars = ({ items }: { items: BarItem[] }) => {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="w-full p-6 flex flex-col gap-3">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
        Bookings by status
      </p>
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
            <span>{item.label}</span>
            <span>{item.value}</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${item.color}`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const DailyBars = ({
  data,
  monthLabel,
}: {
  data: number[];
  monthLabel: string;
}) => {
  const max = Math.max(...data, 1);
  const total = data.reduce((a, b) => a + b, 0);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            Bookings per day
          </p>
          <p className="text-sm font-bold text-slate-700">{monthLabel}</p>
        </div>
        <p className="text-xs font-bold text-slate-400">{total} total</p>
      </div>

      <div className="flex items-end gap-1 h-48">
        {data.map((count, i) => (
          <div
            key={i}
            className="group flex-1 h-full flex flex-col justify-end"
            title={`${monthLabel} ${i + 1}: ${count} booking/s`}
          >
            <div
              className="w-full rounded-t bg-blue-500/80 group-hover:bg-blue-600 transition-colors"
              style={{
                height: count === 0 ? "2px" : `${(count / max) * 100}%`,
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-1 mt-2">
        {data.map((_, i) => (
          <span key={i} className="flex-1 text-center text-[8px] text-slate-400">
            {i === 0 || (i + 1) % 5 === 0 ? i + 1 : ""}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ---------------- Dashboard ---------------- */

const LaundryDashboard = () => {
  const currentYear = new Date().getFullYear();

  // --- Filters ---
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // --- All-time stats ---
  const [lifetime, setLifetime] = useState({
    customers: 0,
    bookings: 0,
    reservation: 0,
    onService: 0,
    completed: 0,
  });

  // --- Monthly stats ---
  const [monthly, setMonthly] = useState({
    customers: 0,
    bookings: 0,
    completed: 0,
    maintenance: 0,
    gross: 0,
  });
  // All-time revenue (completed bookings) and maintenance costs
  const [revenue, setRevenue] = useState({
    gross: 0,
    maintenance: 0,
    unpriced: 0, // completed bookings that have no price yet
  });
  const [dailyBookings, setDailyBookings] = useState<number[]>([]);

  const yearOptions = useMemo(
    () => Array.from({ length: 7 }, (_, i) => currentYear - 3 + i),
    [currentYear],
  );

  const monthName = new Date(selectedYear, selectedMonth).toLocaleString(
    "default",
    { month: "long" },
  );

  // 1. Lifetime stats (once)
  useEffect(() => {
    const fetchGlobalStats = async () => {
      const head = { count: "exact", head: true } as const;

      const results = await Promise.all([
        supabase.from("customer_profile").select("id", head).is("deleted_at", null),
        supabase.from("laundry_booking").select("id", head),
        supabase.from("laundry_booking").select("id", head).eq("status", "On Reservation"),
        supabase.from("laundry_booking").select("id", head).eq("status", "On Service"),
        supabase.from("laundry_booking").select("id", head).eq("status", "Completed"),
      ]);

      const failed = results.find((r) => r.error);
      if (failed?.error) {
        console.error("dashboard stats error:", failed.error);
        toast.error(`Error loading dashboard: ${failed.error.message}`);
        return;
      }

      const [customers, bookings, reservation, onService, completed] = results;
      setLifetime({
        customers: customers.count || 0,
        bookings: bookings.count || 0,
        reservation: reservation.count || 0,
        onService: onService.count || 0,
        completed: completed.count || 0,
      });
    };

    fetchGlobalStats();
  }, []);

  // 1b. All-time revenue and maintenance (once)
  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const [completed, maintenance] = await Promise.all([
          fetchAllRows(() =>
            supabase
              .from("laundry_booking")
              .select("price")
              .eq("status", "Completed")
              .order("id"),
          ),
          fetchAllRows(() =>
            supabase
              .from("laundry_maintenance")
              .select("cost_of_maintenance")
              .is("deleted_at", null)
              .order("id"),
          ),
        ]);

        setRevenue({
          gross: completed.reduce((acc, r) => acc + (Number(r.price) || 0), 0),
          maintenance: maintenance.reduce(
            (acc, r) => acc + (Number(r.cost_of_maintenance) || 0),
            0,
          ),
          unpriced: completed.filter((r) => r.price == null).length,
        });
      } catch (error: any) {
        console.error("dashboard revenue error:", error);
        toast.error(`Error loading revenue: ${error.message}`);
      }
    };

    fetchRevenue();
  }, []);

  // 2. Monthly stats (when month/year changes)
  const fetchMonthlyData = useCallback(async () => {
    // Local month boundaries
    const start = new Date(selectedYear, selectedMonth, 1);
    const next = new Date(selectedYear, selectedMonth + 1, 1);
    const startIso = start.toISOString();
    const nextIso = next.toISOString();
    const startDate = toDateString(start);
    const nextDate = toDateString(next);

    const [resBookings, resCompleted, resMaintenance, resCustomers] =
      await Promise.all([
        // Bookings created in the selected month
        supabase
          .from("laundry_booking")
          .select("created_at")
          .gte("created_at", startIso)
          .lt("created_at", nextIso),

        // Completed bookings that ended in the selected month
        supabase
          .from("laundry_booking")
          .select("price")
          .eq("status", "Completed")
          .gte("end_date", startDate)
          .lt("end_date", nextDate),

        // Maintenance done in the selected month
        supabase
          .from("laundry_maintenance")
          .select("cost_of_maintenance")
          .is("deleted_at", null)
          .gte("date", startDate)
          .lt("date", nextDate),

        // New customers in the selected month
        supabase
          .from("customer_profile")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .gte("created_at", startIso)
          .lt("created_at", nextIso),
      ]);

    const failed = [resBookings, resCompleted, resMaintenance, resCustomers].find(
      (r) => r.error,
    );
    if (failed?.error) {
      console.error("dashboard monthly error:", failed.error);
      toast.error(`Error loading monthly data: ${failed.error.message}`);
      return;
    }

    const maintenanceTotal =
      resMaintenance.data?.reduce(
        (acc: number, item: any) => acc + (Number(item.cost_of_maintenance) || 0),
        0,
      ) || 0;

    // Revenue from completed bookings that ended in the month
    const completedRows = resCompleted.data || [];
    const grossTotal = completedRows.reduce(
      (acc: number, r: any) => acc + (Number(r.price) || 0),
      0,
    );

    // Bookings per day of the month
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const perDay = new Array(daysInMonth).fill(0) as number[];
    resBookings.data?.forEach((b: any) => {
      perDay[new Date(b.created_at).getDate() - 1] += 1;
    });

    setDailyBookings(perDay);
    setMonthly({
      customers: resCustomers.count || 0,
      bookings: resBookings.data?.length || 0,
      completed: completedRows.length,
      maintenance: maintenanceTotal,
      gross: grossTotal,
    });
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

  const monthlyNet = monthly.gross - monthly.maintenance;
  const lifetimeNet = revenue.gross - revenue.maintenance;

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-10 pt-8 px-4 lg:px-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Overview
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Laundry service performance summary.
          </p>
        </div>

        {/* Date filter */}
        <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border-none bg-slate-50 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border-none bg-slate-50 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Top row: lifetime stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            className="bg-white border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl p-2"
            title={<span className="text-slate-800">Total Customers</span>}
            linkText="View All"
            url="/laundry/customers"
            amount={
              <span className="text-5xl font-black text-slate-800">
                {lifetime.customers}
              </span>
            }
            description={
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Lifetime Customers
              </span>
            }
            linkIcon={<icons.rightArrow className="text-blue-500" />}
          />
          <Card
            className="bg-white border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl p-2"
            title={<span className="text-slate-800">Total Bookings</span>}
            linkText="View All"
            url="/laundry/bookings/on-service"
            amount={
              <span className="text-5xl font-black text-slate-800">
                {lifetime.bookings}
              </span>
            }
            description={
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Lifetime Records
              </span>
            }
            linkIcon={<icons.rightArrow className="text-blue-500" />}
          />
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex items-center justify-center min-h-40">
            <StatusBars
              items={[
                { label: "On Reservation", value: lifetime.reservation, color: "bg-blue-500" },
                { label: "On Service", value: lifetime.onService, color: "bg-emerald-500" },
                { label: "Completed", value: lifetime.completed, color: "bg-slate-500" },
              ]}
            />
          </div>
        </div>

        {/* All-time revenue */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl shadow-sm border border-slate-100 bg-emerald-50/30">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter mb-1">
              Total Revenue
            </p>
            <p className="text-3xl font-black text-emerald-700">
              ₱{revenue.gross.toLocaleString()}
            </p>
            <p className="text-[10px] text-emerald-600/70 mt-2">
              From {lifetime.completed} completed bookings
            </p>
            {revenue.unpriced > 0 && (
              <p className="text-[10px] font-bold text-amber-600 mt-1">
                {revenue.unpriced} completed booking(s) have no price
              </p>
            )}
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">
              Total Maintenance
            </p>
            <p className="text-3xl font-black text-red-500">
              ₱{revenue.maintenance.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 mt-2">
              All repair expenses
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">
              Net Revenue
            </p>
            <p
              className={`text-3xl font-black ${lifetimeNet < 0 ? "text-red-500" : "text-slate-800"}`}
            >
              ₱{lifetimeNet.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 mt-2">
              All-time, after maintenance
            </p>
          </div>
        </div>

        {/* Middle row: monthly breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">
              Monthly New Customers
            </p>
            <p className="text-3xl font-black text-slate-800">
              {monthly.customers}
            </p>
            <p className="text-[10px] text-slate-400 mt-2">
              Added in {monthName}
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">
              Monthly Bookings
            </p>
            <p className="text-3xl font-black text-slate-800">
              {monthly.bookings}
            </p>
            <p className="text-[10px] text-slate-400 mt-2">
              New bookings created
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">
              Monthly Maintenance
            </p>
            <p className="text-3xl font-black text-red-500">
              ₱{monthly.maintenance.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 mt-2">
              Total repair expenses
            </p>
          </div>
          <div className="p-6 rounded-2xl shadow-sm border border-slate-100 bg-emerald-50/30">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter mb-1">
              Gross Revenue
            </p>
            <p className="text-3xl font-black text-emerald-700">
              ₱{monthly.gross.toLocaleString()}
            </p>
            <p className="text-[10px] text-emerald-600/70 mt-2">
              From {monthly.completed} completed in {monthName}
            </p>
          </div>
        </div>

        {/* Bottom row: chart + active cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden p-6">
            <DailyBars data={dailyBookings} monthLabel={`${monthName} ${selectedYear}`} />
          </div>

          <div className="flex flex-col gap-6">
            <Card
              className="bg-white border-none shadow-sm h-full rounded-2xl"
              title="Currently Active"
              url="/laundry/bookings/on-service"
              amount={
                <span className="text-5xl font-black text-blue-600">
                  {lifetime.onService}
                </span>
              }
              description={"Bookings currently on service"}
              linkIcon={<icons.onService className="text-blue-500" size={24} />}
            />

            <Card
              className="bg-white border-none shadow-sm h-full rounded-2xl"
              title="Net Revenue"
              url={""}
              amount={
                <span
                  className={`text-5xl font-black ${monthlyNet < 0 ? "text-red-500" : "text-slate-800"}`}
                >
                  ₱{monthlyNet.toLocaleString()}
                </span>
              }
              description={`Earnings after maintenance for ${monthName}`}
              linkIcon={<icons.money className="text-emerald-500" size={24} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LaundryDashboard);