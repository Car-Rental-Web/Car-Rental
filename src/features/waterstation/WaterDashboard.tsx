/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import icons from "../../constants/icon";
import { supabaseWater as supabase } from "../../utils/supabase";
import Card from "../../components/Card";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// "YYYY-MM-DD" for the first day of a month
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
        Orders by status
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

const DailyBars = ({ data, monthLabel }: { data: number[]; monthLabel: string }) => {
  const max = Math.max(...data, 1);
  const total = data.reduce((a, b) => a + b, 0);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            Gallons per day
          </p>
          <p className="text-sm font-bold text-slate-700">{monthLabel}</p>
        </div>
        <p className="text-xs font-bold text-slate-400">{total} gallons</p>
      </div>

      <div className="flex items-end gap-1 h-48">
        {data.map((count, i) => (
          <div
            key={i}
            className="group flex-1 h-full flex flex-col justify-end"
            title={`${monthLabel} ${i + 1}: ${count} gallon/s`}
          >
            <div
              className="w-full rounded-t bg-blue-500/80 group-hover:bg-blue-600 transition-colors"
              style={{ height: count === 0 ? "2px" : `${(count / max) * 100}%` }}
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

const WaterDashboard = () => {
  const currentYear = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // --- All-time stats ---
  const [lifetime, setLifetime] = useState({
    customers: 0,
    orders: 0,
    scheduled: 0,
    onDelivery: 0,
    completed: 0,
  });
  const [totals, setTotals] = useState({
    revenue: 0,
    gallons: 0,
    unpaid: 0,
    jugsOut: 0,
  });

  // --- Monthly stats ---
  const [monthly, setMonthly] = useState({
    customers: 0,
    orders: 0,
    gallons: 0,
    revenue: 0,
  });
  const [dailyGallons, setDailyGallons] = useState<number[]>([]);

  const yearOptions = useMemo(
    () => Array.from({ length: 7 }, (_, i) => currentYear - 3 + i),
    [currentYear],
  );

  const monthName = new Date(selectedYear, selectedMonth).toLocaleString("default", {
    month: "long",
  });

  // 1. Counts (once)
  useEffect(() => {
    const fetchCounts = async () => {
      const head = { count: "exact", head: true } as const;

      const results = await Promise.all([
        supabase.from("water_customer").select("id", head).is("deleted_at", null),
        supabase.from("water_order").select("id", head).is("deleted_at", null),
        supabase.from("water_order").select("id", head).eq("status", "Scheduled").is("deleted_at", null),
        supabase.from("water_order").select("id", head).eq("status", "On Delivery").is("deleted_at", null),
        supabase.from("water_order").select("id", head).eq("status", "Completed").is("deleted_at", null),
      ]);

      const failed = results.find((r) => r.error);
      if (failed?.error) {
        console.error("dashboard counts error:", failed.error);
        toast.error(`Error loading dashboard: ${failed.error.message}`);
        return;
      }

      const [customers, orders, scheduled, onDelivery, completed] = results;
      setLifetime({
        customers: customers.count || 0,
        orders: orders.count || 0,
        scheduled: scheduled.count || 0,
        onDelivery: onDelivery.count || 0,
        completed: completed.count || 0,
      });
    };

    fetchCounts();
  }, []);

  // 1b. All-time revenue, gallons, unpaid, and jugs out (once)
  useEffect(() => {
    const fetchTotals = async () => {
      try {
        const [completed, summary] = await Promise.all([
          fetchAllRows(() =>
            supabase
              .from("water_order")
              .select("total_price, quantity, payment_status")
              .eq("status", "Completed")
              .is("deleted_at", null)
              .order("id"),
          ),
          fetchAllRows(() =>
            supabase.from("water_customer_summary").select("jugs_on_hand").order("customer_id"),
          ),
        ]);

        setTotals({
          revenue: completed.reduce((a, r) => a + (Number(r.total_price) || 0), 0),
          gallons: completed.reduce((a, r) => a + (Number(r.quantity) || 0), 0),
          unpaid: completed
            .filter((r) => r.payment_status === "Unpaid")
            .reduce((a, r) => a + (Number(r.total_price) || 0), 0),
          jugsOut: summary.reduce((a, r) => a + (Number(r.jugs_on_hand) || 0), 0),
        });
      } catch (error: any) {
        console.error("dashboard totals error:", error);
        toast.error(`Error loading totals: ${error.message}`);
      }
    };

    fetchTotals();
  }, []);

  // 2. Monthly stats (when month/year changes)
  const fetchMonthlyData = useCallback(async () => {
    const start = new Date(selectedYear, selectedMonth, 1);
    const next = new Date(selectedYear, selectedMonth + 1, 1);
    const startDate = toDateString(start);
    const nextDate = toDateString(next);

    const [resOrders, resCustomers] = await Promise.all([
      // Orders delivered (or due) in the selected month, cancelled ones left out
      supabase
        .from("water_order")
        .select("delivery_date, quantity, status, total_price")
        .is("deleted_at", null)
        .neq("status", "Cancelled")
        .gte("delivery_date", startDate)
        .lt("delivery_date", nextDate),

      // New customers in the selected month
      supabase
        .from("water_customer")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .gte("created_at", start.toISOString())
        .lt("created_at", next.toISOString()),
    ]);

    const failed = [resOrders, resCustomers].find((r) => r.error);
    if (failed?.error) {
      console.error("dashboard monthly error:", failed.error);
      toast.error(`Error loading monthly data: ${failed.error.message}`);
      return;
    }

    const rows = resOrders.data || [];
    const completedRows = rows.filter((r: any) => r.status === "Completed");

    // Gallons per day of the month
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const perDay = new Array(daysInMonth).fill(0) as number[];
    rows.forEach((r: any) => {
      const day = Number(String(r.delivery_date).slice(8, 10));
      if (day >= 1 && day <= daysInMonth) perDay[day - 1] += Number(r.quantity) || 0;
    });

    setDailyGallons(perDay);
    setMonthly({
      customers: resCustomers.count || 0,
      orders: rows.length,
      gallons: completedRows.reduce((a: number, r: any) => a + (Number(r.quantity) || 0), 0),
      revenue: completedRows.reduce((a: number, r: any) => a + (Number(r.total_price) || 0), 0),
    });
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-10 pt-8 px-4 lg:px-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Overview</h1>
          <p className="text-sm text-slate-500 font-medium">
            Water station deliveries and sales summary.
          </p>
        </div>

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
            url="/water/customers"
            amount={<span className="text-5xl font-black text-slate-800">{lifetime.customers}</span>}
            description={
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Lifetime Customers
              </span>
            }
            linkIcon={<icons.rightArrow className="text-blue-500" />}
          />
          <Card
            className="bg-white border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl p-2"
            title={<span className="text-slate-800">Total Orders</span>}
            linkText="View All"
            url="/water/history"
            amount={<span className="text-5xl font-black text-slate-800">{lifetime.orders}</span>}
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
                { label: "Scheduled", value: lifetime.scheduled, color: "bg-blue-500" },
                { label: "On Delivery", value: lifetime.onDelivery, color: "bg-amber-500" },
                { label: "Completed", value: lifetime.completed, color: "bg-emerald-500" },
              ]}
            />
          </div>
        </div>

        {/* All-time sales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl shadow-sm border border-slate-100 bg-emerald-50/30">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter mb-1">
              Total Revenue
            </p>
            <p className="text-3xl font-black text-emerald-700">
              ₱{totals.revenue.toLocaleString()}
            </p>
            <p className="text-[10px] text-emerald-600/70 mt-2">From completed orders</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">
              Gallons Delivered
            </p>
            <p className="text-3xl font-black text-slate-800">
              {totals.gallons.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 mt-2">All time</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">
              Jugs Out With Customers
            </p>
            <p className="text-3xl font-black text-blue-600">
              {totals.jugsOut.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 mt-2">Delivered minus empties returned</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">
              Unpaid Balance
            </p>
            <p
              className={`text-3xl font-black ${totals.unpaid > 0 ? "text-red-500" : "text-slate-800"}`}
            >
              ₱{totals.unpaid.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 mt-2">Completed but not yet paid</p>
          </div>
        </div>

        {/* Monthly breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">
              Monthly New Customers
            </p>
            <p className="text-3xl font-black text-slate-800">{monthly.customers}</p>
            <p className="text-[10px] text-slate-400 mt-2">Added in {monthName}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">
              Monthly Orders
            </p>
            <p className="text-3xl font-black text-slate-800">{monthly.orders}</p>
            <p className="text-[10px] text-slate-400 mt-2">Deliveries in {monthName}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">
              Monthly Gallons
            </p>
            <p className="text-3xl font-black text-blue-600">
              {monthly.gallons.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 mt-2">Delivered and completed</p>
          </div>
          <div className="p-6 rounded-2xl shadow-sm border border-slate-100 bg-emerald-50/30">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter mb-1">
              Monthly Revenue
            </p>
            <p className="text-3xl font-black text-emerald-700">
              ₱{monthly.revenue.toLocaleString()}
            </p>
            <p className="text-[10px] text-emerald-600/70 mt-2">
              Completed orders in {monthName}
            </p>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden p-6">
            <DailyBars data={dailyGallons} monthLabel={`${monthName} ${selectedYear}`} />
          </div>

          <div className="flex flex-col gap-6">
            <Card
              className="bg-white border-none shadow-sm h-full rounded-2xl"
              title="On Delivery"
              url="/water/orders/on-delivery"
              amount={<span className="text-5xl font-black text-amber-500">{lifetime.onDelivery}</span>}
              description={"Orders out for delivery now"}
              linkIcon={<icons.onService className="text-amber-500" size={24} />}
            />
            <Card
              className="bg-white border-none shadow-sm h-full rounded-2xl"
              title="Scheduled"
              url="/water/orders/scheduled"
              amount={<span className="text-5xl font-black text-blue-600">{lifetime.scheduled}</span>}
              description={"Deliveries still to do"}
              linkIcon={<icons.calendar className="text-blue-500" size={24} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(WaterDashboard);