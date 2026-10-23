/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { supabaseWater as supabase } from "../../../utils/supabase";
import { filterData } from "../../../utils/FilterData";
import { useDebouncedValue } from "../../../utils/useDebounce";
import { usePagination } from "../../../utils/Pagination";
import { SearchBar } from "../../../components";
import icons from "../../../constants/icon";
import { formatDateandDay, to12Hour } from "../../../utils/timeFormatter";
import WaterOrderForm, {
  ORDER_STATUSES,
  type WaterOrderData,
} from "./Waterorderform";
import DeleteModal from "../../../modals/DeleteModal";

interface WaterOrderTableProps {
  /** Heading shown at the top, e.g. "Scheduled" */
  title: string;
  /** Which statuses this table shows. Leave out to show every order. */
  statuses?: string[];
  /** Sort newest first (handy for Completed). Default: soonest first. */
  newestFirst?: boolean;
}

const headerCell =
  "p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center";

const statusClass = (status: string) =>
  status === "Completed"
    ? "bg-emerald-500 text-emerald-50 border-emerald-400"
    : status === "On Delivery"
      ? "bg-amber-500 text-amber-50 border-amber-400"
      : status === "Scheduled"
        ? "bg-blue-500 text-blue-50 border-blue-400"
        : "bg-slate-200 text-slate-600 border-slate-300";

const WaterOrderTable = ({
  title,
  statuses,
  newestFirst = false,
}: WaterOrderTableProps) => {
  // `statuses` is usually an inline array, so compare by value, not identity
  const statusKey = statuses?.join("|") ?? "";
  const statusList = useMemo(
    () => (statusKey ? statusKey.split("|") : undefined),
    [statusKey],
  );

  const [allOrders, setAllOrders] = useState<WaterOrderData[]>([]);
  const [orders, setOrders] = useState<WaterOrderData[]>([]);

  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const debounceSearchTerm = useDebouncedValue(searchTerm, 200);

  const [openForm, setOpenForm] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit" | "view">("create");
  const [openDelete, setOpenDelete] = useState(false);
  const [selected, setSelected] = useState<WaterOrderData | null>(null);

  const {
    currentPage,
    setCurrentPage,
    currentItems,
    totalPages,
    indexOfFirstItem,
    indexOfLastItem,
    itemsPerPage,
    setItemsPerPage,
  } = usePagination(orders, 5);

  const statusOptions = statusList ?? ORDER_STATUSES;
  const showStatusFilter = statusOptions.length > 1;

  /* ---------------- Fetch + live updates ---------------- */
  const fetchOrders = useCallback(async () => {
    let query = supabase.from("water_order").select("*").is("deleted_at", null);
    if (statusList) query = query.in("status", statusList);

    const { data, error } = await query
      .order("delivery_date", { ascending: !newestFirst })
      .order("delivery_time", { ascending: !newestFirst });

    if (error) {
      console.error("water_order error:", error);
      toast.error(`Error fetching orders: ${error.message}`);
      return;
    }
    setAllOrders(data || []);
  }, [statusList, newestFirst]);

  useEffect(() => {
    setSelectedStatus("All");
    setSearchTerm("");
    fetchOrders();

    // Any change refetches, so an order that changes status
    // moves to the right table on its own.
    const channel = supabase
      .channel(`water-order-${statusKey || "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "water_order" },
        () => fetchOrders(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, statusKey]);

  /* ---------------- Search + status filter ---------------- */
  useEffect(() => {
    let filtered = [...allOrders];

    if (selectedStatus !== "All") {
      filtered = filtered.filter((item) => item.status === selectedStatus);
    }

    if (debounceSearchTerm) {
      filtered = filterData(debounceSearchTerm, filtered, [
        "full_name",
        "address",
        "phone_number",
        "product_name",
        "container_type",
        "rider",
        "delivery_date",
        "payment_status",
      ]);
    }

    setOrders(filtered);
    setCurrentPage(1);
  }, [debounceSearchTerm, allOrders, selectedStatus, setCurrentPage]);

  /* ---------------- Actions ---------------- */
  const handleAction = (mode: "view" | "edit", row: WaterOrderData) => {
    setFormMode(mode);
    setSelected(row);
    setOpenForm(true);
  };

  // Soft delete, like the rest of the app
  const handleDelete = async () => {
    if (!selected) return;

    try {
      const { error } = await supabase
        .from("water_order")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", selected.id);
      if (error) throw error;

      toast.success(`Order deleted: ${selected.full_name ?? ""}`);
      setOpenDelete(false);
      setSelected(null);
      fetchOrders();
    } catch (error: any) {
      console.error("Failed to delete:", error);
      toast.error(error.message || "Failed to delete order");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-slate-50 w-full pt-12 px-8 flex flex-col gap-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 font-medium">
            Monitoring {orders.length} total orders
          </p>
        </div>

        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
          {/* <button
            onClick={() => {
              setFormMode("create");
              setSelected(null);
              setOpenForm(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md cursor-pointer"
          >
            <icons.add size={16} /> New Order
          </button> */}

          {showStatusFilter && (
            <div className="relative min-w-[180px]">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full py-2.5 px-4 bg-white border border-slate-200 shadow-sm text-sm font-semibold text-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="All">All Status</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <icons.filter size={14} />
              </div>
            </div>
          )}

          <div className="w-full md:w-80">
            <SearchBar
              onClear={() => setSearchTerm("")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2.5 px-4 bg-white border border-slate-200 shadow-sm text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Search Order Details..."
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-left min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className={headerCell}>No</th>
                <th className={headerCell}>Customer Information</th>
                <th className={headerCell}>Contact</th>
                <th className={headerCell}>Product</th>
                <th className={headerCell}>Qty</th>
                <th className={headerCell}>Total</th>
                <th className={headerCell}>Delivery</th>
                <th className={headerCell}>Rider</th>
                <th className={headerCell}>Empties</th>
                <th className={headerCell}>Status</th>
                <th className={headerCell}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.length > 0 ? (
                currentItems.map((row, index) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-center text-sm font-bold text-slate-800">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col text-center">
                        <span className="text-sm font-bold text-slate-800">
                          {row.full_name}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[220px] mx-auto">
                          {row.address}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center text-xs font-mono text-slate-700">
                      {row.phone_number || "N/A"}
                    </td>
                    <td className="p-4 text-center">
                      <div className="text-xs font-bold text-blue-600">
                        {row.product_name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {row.container_type}
                      </div>
                    </td>
                    <td className="p-4 text-center text-sm font-black text-slate-700">
                      {row.quantity}
                    </td>
                    <td className="p-4 text-center">
                      <div className="text-xs font-black text-slate-800">
                        ₱{(Number(row.total_price) || 0).toLocaleString()}
                      </div>
                      <div
                        className={`text-[10px] font-bold uppercase ${
                          row.payment_status === "Paid"
                            ? "text-emerald-600"
                            : "text-red-500"
                        }`}
                      >
                        {row.payment_status}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="text-xs font-medium text-slate-700">
                        {formatDateandDay(row.delivery_date)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {row.delivery_time ? to12Hour(row.delivery_time) : "Any time"}
                      </div>
                    </td>
                    <td className="p-4 text-center text-xs text-slate-600">
                      {row.rider || "—"}
                    </td>
                    <td className="p-4 text-center text-sm font-bold text-slate-700">
                      {row.status === "Completed" ? row.empties_returned : "—"}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center">
                        <span
                          className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter shadow-sm border ${statusClass(row.status)}`}
                        >
                          {row.status}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleAction("view", row)}
                          className="cursor-pointer p-2 bg-white border border-slate-200 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm"
                        >
                          <icons.openEye size={16} />
                        </button>
                        <button
                          onClick={() => handleAction("edit", row)}
                          className="cursor-pointer p-2 bg-white border border-slate-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                        >
                          <icons.edit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelected(row);
                            setOpenDelete(true);
                          }}
                          className="cursor-pointer p-2 bg-white border border-slate-200 rounded-lg text-red-500 hover:bg-red-50 transition-all shadow-sm"
                        >
                          <icons.trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="p-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-3 bg-slate-100 rounded-full text-slate-400">
                        <icons.filter size={24} />
                      </div>
                      <p className="text-sm text-slate-500 font-medium text-center">
                        {searchTerm.length > 0 && selectedStatus !== "All" ? (
                          <>
                            No matches found for{" "}
                            <span className="text-slate-900 font-bold">"{searchTerm}"</span>{" "}
                            in{" "}
                            <span className="text-slate-900 font-bold">{selectedStatus}</span>
                          </>
                        ) : searchTerm.length > 0 ? (
                          <>
                            No results found for{" "}
                            <span className="text-slate-900 font-bold">"{searchTerm}"</span>
                          </>
                        ) : selectedStatus !== "All" ? (
                          <>
                            No orders currently{" "}
                            <span className="text-slate-900 font-bold">{selectedStatus}</span>
                          </>
                        ) : (
                          "No orders found."
                        )}
                      </p>
                      {(searchTerm || selectedStatus !== "All") && (
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setSelectedStatus("All");
                          }}
                          className="text-xs text-blue-600 font-bold hover:underline mt-2"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 mb-10 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[5, 10, 15, 20].map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>
          </div>
          <div className="h-4 w-px bg-slate-200 mx-2" />
          <p className="text-xs font-semibold text-slate-500">
            Results:{" "}
            <span className="text-slate-900">
              {orders.length === 0 ? 0 : indexOfFirstItem + 1}-
              {Math.min(indexOfLastItem, orders.length)}
            </span>{" "}
            of <span className="text-slate-900">{orders.length}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm"
          >
            Prev
          </button>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
            {currentPage} <span className="text-blue-300 mx-1">/</span> {totalPages || 1}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modals */}
      <WaterOrderForm
        open={openForm}
        mode={formMode}
        order={selected}
        onClose={() => {
          setOpenForm(false);
          setSelected(null);
        }}
        onSuccess={fetchOrders}
      />

      {openDelete && selected && (
        <DeleteModal
          open={openDelete}
          onClose={() => {
            setOpenDelete(false);
            setSelected(null);
          }}
          onClick={handleDelete}
        />
      )}
    </div>
  );
};

export default WaterOrderTable;