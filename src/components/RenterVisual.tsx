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
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchRenter = async () => {
      setLoading(true);
      // Construct date range for the entire year
      const startDate = `${selectedYear}-01-01T00:00:00.000Z`;
      const endDate = `${selectedYear}-12-31T23:59:59.999Z`;

      const { data, error } = await supabase
        .from("renter")
        .select("created_at")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (error) {
        console.error("Error Fetching Renter Data", error);
        setLoading(false);
        return;
      }

      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];

      // 1. Initialize counts for all months
      const counts = Array(12).fill(0);

      // 2. Aggregate data safely using UTC methods
      if (data) {
        data.forEach((renter) => {
          // Parse string to Date object
          const date = new Date(renter.created_at);
          // Use UTC month to avoid local timezone offset issues
          const monthIndex = date.getUTCMonth(); 
          if (monthIndex >= 0 && monthIndex < 12) {
            counts[monthIndex] += 1;
          }
        });
      }

      // 3. Format for chart
      const formatted = months.map((m, i) => ({
        month: m,
        count: counts[i],
      }));
      
      setChartData(formatted);
      setLoading(false);
    };

    fetchRenter();
  }, [selectedYear]);

  return (
    <div className="flex flex-col w-full p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h3 className="text-lg font-black text-slate-800">Growth Analysis</h3>
           <p className="text-sm text-slate-500">Monthly new renter acquisitions for {selectedYear}</p>
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
      
      <div className="w-full relative min-h-[250px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
            Loading data...
          </div>
        ) : (
          <ReactChartLine data={chartData} maxHeight={"250px"} maxWidth={""} />
        )}
      </div>
    </div>
  );
};

export default React.memo(RenterVisual);