/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense, useEffect, useState, useCallback } from "react";
import icons from "../constants/icon";
import { supabase } from "../utils/supabase";
import React from "react";
import Card from "../components/Card";

const BookingVisual = React.lazy(() => import("../components/BookingVisual"));
const RenterVisual = React.lazy(() => import("../components/RenterVisual"));

const Dashboard = () => {
  const [value, setValue] = useState<number>(0); // Net Revenue (Filtered)
  const [status, setStatus] = useState<number>(0); // On Service (All-time)
  const [renter, setRenter] = useState<number>(0); // Total Renters (All-time)
  const [booking, setBooking] = useState<number>(0); // Total Bookings (All-time    )

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // 1. Optimized: Fetch all-time data ONCE on mount
  useEffect(() => {
    const fetchGlobalStats = async () => {
      const [allTimeBookingsRes, rentersRes] = await Promise.all([
        // Count bookings without downloading them
        supabase.from("renter_booking").select("status", { count: 'exact', head: true }).is("deleted_at", null),
        // Count renters without downloading them
        supabase.from("renter").select("id", { count: 'exact', head: true }).is("deleted_at", null),
      ]);

      // Count only "On Service" bookings
      const { data: onServiceData } = await supabase
        .from("renter_booking")
        .select("status")
        .eq("status", "On Service")
        .is("deleted_at", null);

      setBooking(allTimeBookingsRes.count || 0);
      setRenter(rentersRes.count || 0);
      setStatus(onServiceData?.length || 0);
    };

    fetchGlobalStats();
  }, []);

  // 2. Optimized: Fetch monthly data only when filter changes
  const fetchMonthlyData = useCallback(async () => {
    const startDate = new Date(selectedYear, selectedMonth, 1).toISOString();
    const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59).toISOString();

    const [filteredBookings, filteredMaintenance] = await Promise.all([
      // A. Monthly Bookings (for Revenue)
      supabase
        .from("renter_booking")
        .select("status, total_price_rent")
        .is("deleted_at", null)
        .gte("created_at", startDate)
        .lte("created_at", endDate),

      // B. Monthly Maintenance (for Expenses)
      supabase
        .from("maintenance")
        .select("cost_of_maintenance")
        .is("deleted_at", null)
        .gte("created_at", startDate)
        .lte("created_at", endDate),
    ]);

    const monthlyMaintenance = filteredMaintenance.data?.reduce(
      (acc, item) => acc + Number(item.cost_of_maintenance || 0), 0
    ) || 0;

    const monthlyGrossRevenue = filteredBookings.data?.reduce((acc, item) => {
      return item.status === "Completed" ? acc + Number(item.total_price_rent || 0) : acc;
    }, 0) || 0;

    setValue(monthlyGrossRevenue - monthlyMaintenance);
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-10 pt-8 px-4 lg:px-10">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Overview</h1>
        <p className="text-sm text-slate-500 font-medium">
          Monitoring your rental performance and fleet status.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Top Row: General Stats & Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            className="bg-white border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl p-2"
            title={<span className="text-slate-800">Total Renters</span>}
            linkText="View All"
            linkIcon={<icons.rightArrow className="text-blue-500" />}
            url="/renterprofile"
            amount={<span className="text-5xl font-black text-slate-800">{renter}</span>}
            description={
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Total Customers
              </span>
            }
          />
          <Card
            className="bg-white border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl p-2"
            title={<span className="text-slate-800">Total Bookings</span>}
            linkText="View All"
            linkIcon={<icons.rightArrow className="text-blue-500" />}
            url="/historyofrent"
            amount={<span className="text-5xl font-black text-slate-800">{booking}</span>}
            description={
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Lifetime Bookings
              </span>
            }
          />
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex items-center justify-center">
            <Suspense fallback={<div className="h-40 w-full animate-pulse bg-slate-100" />}>
              <BookingVisual />
            </Suspense>
          </div>
        </div>

        {/* Bottom Row: Visuals & Financial Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <Suspense fallback={<div className="h-60 w-full animate-pulse bg-slate-100" />}>
              <RenterVisual />
            </Suspense>
          </div>

          <div className="flex flex-col gap-4">
            {/* Filter Section */}
            <div className="flex gap-4 bg-white p-4 rounded-2xl shadow-sm w-full">
              <div className="flex flex-col w-full">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="border-none bg-slate-50 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 mt-1"
                >
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col w-full">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="border-none bg-slate-50 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 mt-1"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Financial Status Cards */}
            <Card
              className="bg-white border-none shadow-sm h-full rounded-2xl"
              title="Net Revenue"
              url={""}
              amount={
                <span className={`text-4xl font-black ${value < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  ₱{value.toLocaleString()}
                </span>
              }
              description={"Revenue minus maintenance Expense"}
              linkIcon={<icons.money className="text-emerald-500" />}
            />

            <Card
              className="bg-white border-none shadow-sm h-full rounded-2xl"
              title="Active Units"
              url={""}
              amount={<span className="text-4xl font-black text-blue-600">{status}</span>}
              description={"Vehicles currently with renters (All-time)"}
              linkIcon={<icons.onService className="text-blue-500" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Dashboard);