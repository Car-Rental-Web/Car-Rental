/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense, useEffect, useState, useCallback } from "react";
import icons from "../constants/icon";
import { supabase } from "../utils/supabase";
import React from "react";
import Card from "../components/Card";

const BookingVisual = React.lazy(() => import("../components/BookingVisual"));
const RenterVisual = React.lazy(() => import("../components/RenterVisual"));

const Dashboard = () => {
  // --- All-time Stats ---
  const [totalBooking, setTotalBooking] = useState<number>(0);
  const [totalRenter, setTotalRenter] = useState<number>(0);
  const [onServiceCount, setOnServiceCount] = useState<number>(0);

  // --- Monthly Filtered Stats ---
  const [monthlyBooking, setMonthlyBooking] = useState<number>(0);
  const [monthlyRenter, setMonthlyRenter] = useState<number>(0);
  const [grossRevenue, setGrossRevenue] = useState<number>(0);
  const [maintenanceExpense, setMaintenanceExpense] = useState<number>(0);
  const [netRevenue, setNetRevenue] = useState<number>(0);

  // --- Filters ---
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // 1. Fetch Global/Lifetime Stats (Run once on mount)
  useEffect(() => {
    const fetchGlobalStats = async () => {
      const [bookingsRes, rentersRes, onServiceRes] = await Promise.all([
        // Total Lifetime Bookings
        supabase.from("renter_booking").select("id", { count: 'exact', head: true }).is("deleted_at", null),
        // Total Lifetime Renters
        supabase.from("renter").select("id", { count: 'exact', head: true }).is("deleted_at", null),
        // Current Units On Service
        supabase.from("renter_booking").select("id", { count: 'exact', head: true }).eq("status", "On Service").is("deleted_at", null),
      ]);

      setTotalBooking(bookingsRes.count || 0);
      setTotalRenter(rentersRes.count || 0);
      setOnServiceCount(onServiceRes.count || 0);
    };

    fetchGlobalStats();
  }, []);

  // 2. Fetch Monthly Analytics (Runs when month/year changes)
  const fetchMonthlyData = useCallback(async () => {
    // Calculate date range for the selected month
    const startDate = new Date(selectedYear, selectedMonth, 1).toISOString();
    const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59).toISOString();
    const startOfMonth = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`;
    const nextMonth = new Date(selectedYear, selectedMonth + 1, 1);
    const startOfNextMonth = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;

    const [resBookings, resCompletedBookings, resMaintenance, resRenters] = await Promise.all([
      // Monthly Bookings created in the selected month
      supabase
        .from("renter_booking")
        .select("status, total_price_rent")
        .is("deleted_at", null)
        .gte("created_at", startDate)
        .lte("created_at", endDate),

      // Revenue from completed bookings that ended in the selected month
      supabase
        .from("renter_booking")
        .select("total_price_rent")
        .eq("status", "Completed")
        .is("deleted_at", null)
        .gte("end_date", startOfMonth)
        .lt("end_date", startOfNextMonth),

      // Monthly Maintenance Expenses
      supabase
        .from("maintenance")
        .select("cost_of_maintenance")
        .is("deleted_at", null)
        .gte("created_at", startDate)
        .lte("created_at", endDate),

      // Monthly New Renters
      supabase
        .from("renter")
        .select("id", { count: 'exact', head: true })
        .is("deleted_at", null)
        .gte("created_at", startDate)
        .lte("created_at", endDate),
    ]);

    // Calculate Maintenance Cost
    const totalMaint = resMaintenance.data?.reduce(
      (acc, item) => acc + Number(item.cost_of_maintenance || 0), 0
    ) || 0;

    // Calculate Gross Revenue using completed bookings ending in the selected month
    const totalGross = resCompletedBookings.data?.reduce((acc, item) => {
      return acc + Number(item.total_price_rent || 0);
    }, 0) || 0;

    setMonthlyBooking(resBookings.data?.length || 0);
    setMonthlyRenter(resRenters.count || 0);
    setMaintenanceExpense(totalMaint);
    setGrossRevenue(totalGross);
    setNetRevenue(totalGross - totalMaint);
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-10 pt-8 px-4 lg:px-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Overview</h1>
          <p className="text-sm text-slate-500 font-medium">
            Fleet performance and financial summary.
          </p>
        </div>

        {/* Global Date Filter */}
        <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border-none bg-slate-50 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border-none bg-slate-50 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            {[2024, 2025, 2026,2027,2028,2029,2030].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Top Row: All-Time High-Level Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            className="bg-white border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl p-2"
            title={<span className="text-slate-800">Total Renters</span>}
            linkText="View All"
            url="/renterprofile"
            amount={<span className="text-5xl font-black text-slate-800">{totalRenter}</span>}
            description={<span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lifetime Customers</span>}
            linkIcon={<icons.rightArrow className="text-blue-500" />}
          />
          <Card
            className="bg-white border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl p-2"
            title={<span className="text-slate-800">Total Bookings</span>}
            linkText="View All"
            url="/historyofrent"
            amount={<span className="text-5xl font-black text-slate-800">{totalBooking}</span>}
            description={<span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lifetime Records</span>}
            linkIcon={<icons.rightArrow className="text-blue-500" />}
          />
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex items-center justify-center min-h-40">
            <Suspense fallback={<div className="h-40 w-full animate-pulse bg-slate-100" />}>
              <BookingVisual />
            </Suspense>
          </div>
        </div>

        {/* Middle Row: Monthly Breakdown Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Monthly New Renters</p>
            <p className="text-3xl font-black text-slate-800">{monthlyRenter}</p>
            <p className="text-[10px] text-slate-400 mt-2">Added in {new Date(0, selectedMonth).toLocaleString('default', { month: 'long' })}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Monthly Bookings</p>
            <p className="text-3xl font-black text-slate-800">{monthlyBooking}</p>
            <p className="text-[10px] text-slate-400 mt-2">New reservations created</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Monthly Maintenance</p>
            <p className="text-3xl font-black text-red-500">₱{maintenanceExpense.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 mt-2">Total repair expenses</p>
          </div>
          <div className=" p-6 rounded-2xl shadow-sm border border-slate-100 bg-emerald-50/30">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter mb-1">Gross Revenue</p>
            <p className="text-3xl font-black text-emerald-700">₱{grossRevenue.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-600/70 mt-2">From completed trips</p>
          </div>
        </div>

        {/* Bottom Row: Visuals & Large Financial Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden p-4">
            <Suspense fallback={<div className="h-60 w-full animate-pulse bg-slate-100" />}>
              <RenterVisual />
            </Suspense>
          </div>

          <div className="flex flex-col gap-6">
            <Card
              className="bg-white border-none shadow-sm h-full rounded-2xl"
              title="Net Revenue"
              url={""}
              amount={
                <span className={`text-5xl font-black ${netRevenue < 0 ? 'text-red-500' : 'text-slate-800'}`}>
                  ₱{netRevenue.toLocaleString()}
                </span>
              }
              description={`Earnings after maintenance for ${new Date(0, selectedMonth).toLocaleString('default', { month: 'short' })}`}
              linkIcon={<icons.money className="text-emerald-500" size={24} />}
            />

            <Card
              className="bg-white border-none shadow-sm h-full rounded-2xl"
              title="Currently Active"
              url="/onservice"
              amount={<span className="text-5xl font-black text-blue-600">{onServiceCount}</span>}
              description={"Vehicles currently out on service"}
              linkIcon={<icons.onService className="text-blue-500" size={24} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Dashboard);