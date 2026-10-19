import React, { useState, useEffect, useMemo } from "react";
import {
  format,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { toast } from "react-toastify";
import { supabaseWater as supabase } from "../../utils/supabase";
import { to12Hour } from "../../utils/timeFormatter";
import type { WaterOrderData } from "./components/Waterorderform";

// Only deliveries that still have to happen show on the calendar
const ACTIVE_STATUSES = ["Scheduled", "On Delivery"];

const cardClass = (status: string) =>
  status === "On Delivery"
    ? "bg-amber-50 border-l-amber-500 text-amber-900"
    : "bg-blue-50 border-l-blue-500 text-blue-900";

const badgeClass = (status: string) =>
  status === "On Delivery" ? "bg-amber-500" : "bg-blue-500";

const WaterCalendar: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [orders, setOrders] = useState<WaterOrderData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const yearOptions = useMemo(
    () => Array.from({ length: 6 }, (_, i) => currentYear - 1 + i),
    [currentYear],
  );

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("water_order")
        .select("*")
        .is("deleted_at", null)
        .in("status", ACTIVE_STATUSES)
        .order("delivery_date", { ascending: true })
        .order("delivery_time", { ascending: true });

      if (error) {
        console.error("water_order error:", error);
        toast.error(`Error fetching deliveries: ${error.message}`);
        return;
      }
      setOrders(data || []);
    };
    fetchOrders();
  }, []);

  const productOptions = useMemo(() => {
    const names = orders
      .map((o) => o.product_name)
      .filter((n): n is string => Boolean(n));
    return Array.from(new Set(names)).sort();
  }, [orders]);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();

    return orders.filter((o) => {
      if (!o.delivery_date) return false;

      const matchesSearch =
        !q ||
        [o.full_name, o.product_name, o.phone_number, o.address, o.rider].some((v) =>
          v?.toLowerCase().includes(q),
        );
      const matchesProduct = productFilter === "all" || o.product_name === productFilter;
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      const matchesYear = o.delivery_date.slice(0, 4) === String(selectedYear);

      return matchesSearch && matchesProduct && matchesStatus && matchesYear;
    });
  }, [orders, searchTerm, productFilter, statusFilter, selectedYear]);

  // Group by date once instead of filtering for every day of the year
  const byDate = useMemo(() => {
    const map = new Map<string, WaterOrderData[]>();
    filtered.forEach((o) => {
      const list = map.get(o.delivery_date) || [];
      list.push(o);
      map.set(o.delivery_date, list);
    });
    return map;
  }, [filtered]);

  const totalGallons = filtered.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);

  const months = eachMonthOfInterval({
    start: startOfYear(new Date(selectedYear, 0, 1)),
    end: endOfYear(new Date(selectedYear, 0, 1)),
  });

  const isFiltered =
    searchTerm !== "" || productFilter !== "all" || statusFilter !== "all";

  const selectClass =
    "flex-1 p-2.5 rounded-xl border border-gray-200 bg-white text-sm";

  return (
    <div className="bg-white min-h-screen w-full">
      {/* Filters */}
      <div className="flex flex-col gap-2.5 p-5 bg-white border-b border-gray-100">
        <input
          type="text"
          placeholder="Search name, product, rider, address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-3 rounded-xl border border-gray-200 outline-none text-base"
        />
        <div className="flex gap-2.5">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className={selectClass}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className={selectClass}
          >
            <option value="all">All Products</option>
            {productOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClass}
          >
            <option value="all">Status</option>
            {ACTIVE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <header className="flex justify-center items-center p-5">
        <h2 className="text-2xl font-extrabold">
          {selectedYear} Deliveries ({filtered.length}) · {totalGallons} gallons
        </h2>
      </header>

      <div className="w-full">
        {filtered.length === 0 && isFiltered ? (
          <div className="py-20 px-5 text-center">
            <div className="text-5xl mb-2.5">🔍</div>
            <p className="text-gray-500 text-lg mb-5">
              No deliveries found matching your filters.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setProductFilter("all");
                setStatusFilter("all");
              }}
              className="px-5 py-2.5 bg-gray-900 text-white rounded-lg font-bold"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          months.map((month) => {
            const days = eachDayOfInterval({
              start: startOfMonth(month),
              end: endOfMonth(month),
            });

            // When filtering, only render months that have deliveries
            if (isFiltered && !days.some((d) => byDate.has(format(d, "yyyy-MM-dd"))))
              return null;

            return (
              <div key={month.toString()} className="w-full">
                <div className="text-3xl font-black px-5 pt-5 text-gray-900 bg-gray-50 border-b border-gray-200">
                  {format(month, "MMMM")}
                </div>

                {days.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayOrders = byDate.get(key) || [];

                  if (isFiltered && dayOrders.length === 0) return null;

                  return (
                    <div
                      key={key}
                      className="flex w-full px-5 pt-6 border-b border-gray-100"
                    >
                      <div className="flex flex-col items-center w-8 pointer-events-none">
                        <div className="w-2.5 h-2.5 bg-gray-300 rounded-full mt-4" />
                        <div className="flex-1 w-0.5 bg-gray-100" />
                      </div>

                      <div className="flex-1 pb-8">
                        <div className="flex items-baseline gap-2.5 mb-4">
                          <span className="text-3xl font-black">{format(day, "d")}</span>
                          <span className="text-gray-500">{format(day, "EEEE")}</span>
                        </div>

                        <div className="flex flex-col gap-4">
                          {dayOrders.map((order) => (
                            <div
                              key={order.id}
                              className={`p-5 rounded-2xl w-full border-l-[6px] ${cardClass(order.status)}`}
                            >
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-lg">{order.full_name}</span>
                                <span className="text-sm font-bold">
                                  {order.delivery_time
                                    ? to12Hour(order.delivery_time)
                                    : "Any time"}
                                </span>
                              </div>

                              <div className="mt-2 space-y-0.5">
                                <p>
                                  💧{" "}
                                  <strong>
                                    {order.quantity} × {order.product_name}
                                  </strong>{" "}
                                  ({order.container_type})
                                </p>
                                {order.phone_number && <p>📞 {order.phone_number}</p>}
                                {order.address && <p>📍 {order.address}</p>}
                                {order.rider && <p>🛵 {order.rider}</p>}
                              </div>

                              <div className="flex justify-between items-center mt-3">
                                <span
                                  className={`text-xs px-2 py-1 rounded-md text-white font-bold ${badgeClass(order.status)}`}
                                >
                                  {order.status}
                                </span>
                                <div className="text-right text-sm font-bold">
                                  <div>
                                    ₱{(Number(order.total_price) || 0).toLocaleString()}
                                  </div>
                                  <div
                                    className={
                                      order.payment_status === "Paid"
                                        ? "text-emerald-700"
                                        : "text-red-600"
                                    }
                                  >
                                    {order.payment_status}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
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

export default WaterCalendar;