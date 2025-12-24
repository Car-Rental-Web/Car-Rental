import { useEffect, useState } from "react";
import icons from "../constants/icon";
import ReactChartLine from "./ReactChartLine";
import { supabase } from "../utils/supabase";
import React from "react";

const years = [2025, 2026, 2027, 2028, 2029, 2030];
const BookingVisual = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [chartData, setChartData] = useState<
    { month: string; count: number }[]
  >([]);
  const [toggle, setToggle] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;

      const { data, error } = await supabase
        .from("booking")
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
  }, [selectedYear]);

  return (
    <div className=" flex flex-col w-full">
      <div>
        <div className="flex justify-between items-center px-4 py-4">
          <p className="text-gray-200">Monthly Bookings</p>
          <div onClick={() => setToggle((prev) => !prev)} className="relative">
            <select
              className=" rounded appearance-none outline-none border border-gray-400 px-8 py-2 cursor-pointer text-xs xl:text-base text-white"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {years.map((year) => (
                <option className="txt-color" key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <div className="absolute top-2 md:top-3 right-2 text-white">
              {toggle ? <icons.up /> : <icons.down />}
            </div>
          </div>
        </div>
      </div>
      <div className="pr-6">
        <ReactChartLine
          data={chartData}
          maxHeight={"20vh"}
          maxWidth={"600px"}
        />
        ;
      </div>
    </div>
  );
};

export default React.memo(BookingVisual);
