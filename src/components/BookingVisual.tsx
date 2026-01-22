import { useEffect, useState } from "react";
import icons from "../constants/icon";
import ReactChartLine from "./ReactChartLine";
import { supabase } from "../utils/supabase";
import React from "react";

const years = [2025, 2026, 2027, 2028, 2029, 2030];
const BookingVisual = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [chartData, setChartData] = useState<
    { month: string; count: number }[]
  >([]);

    const fetchBookings = async () => {
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;

      const { data, error } = await supabase
        .from("renter_booking")
        .select("id, created_at")
        .gte("created_at", startDate)
        .lte("created_at", endDate);
      if (error) {
        console.log("Error Fetching");
        return;
      }
      console.log("Fetched Data", data);
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const counts = Array(12).fill(0);
      data.forEach((renter) => {
        const date = new Date(renter.created_at);
        const monthIndex = date.getMonth();
        counts[monthIndex] += 1;
      });
      const formatted = months.map((m, i) => ({
        month: m,
        count: counts[i] ?? 0,
      }));
      setChartData(formatted);
    };
    fetchBookings();

    useEffect(() => {
      fetchBookings()
    },[fetchBookings])
  return (
    <div className="flex flex-col w-full p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Analytics</p>
           <h3 className="text-sm font-bold text-slate-800">Monthly Bookings</h3>
        </div>
        <div className="relative group">
          <select
            className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
          <icons.down className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none size-3" />
        </div>
      </div>
      <div className="w-full">
        <ReactChartLine data={chartData} maxHeight={"150px"} maxWidth={""} />
      </div>
    </div>
  );
};

export default React.memo(BookingVisual);
