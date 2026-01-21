import { useEffect, useState } from "react";
import ReactChartLine from "./ReactChartLine";
import { supabase } from "../utils/supabase";
import React from "react";

const years = [2025, 2026, 2027, 2028, 2029, 2030];
const RenterVisual = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [chartData, setChartData] = useState<
    { month: string; count: number }[]
  >([]);
  useEffect(() => {
    const fetchRenter = async () => {
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;
      const { data, error } = await supabase
        .from("renter")
        .select("id, created_at")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (error) {
        console.log("Error Fetching", error);
        return;
      }
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

      console.log("Fetched Data", data);
    };
    fetchRenter();
  }, [selectedYear]);

  return (
    <div className="flex flex-col w-full p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h3 className="text-lg font-black text-slate-800">Growth Analysis</h3>
           <p className="text-sm text-slate-500">Monthly new renter acquisitions</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            {years.slice(0, 3).map((year) => (
                <button 
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedYear === year ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    {year}
                </button>
            ))}
        </div>
      </div>
      <div className="w-full">
        <ReactChartLine data={chartData} maxHeight={"250px"} maxWidth={""} />
      </div>
    </div>
  );
};

export default React.memo(RenterVisual);
