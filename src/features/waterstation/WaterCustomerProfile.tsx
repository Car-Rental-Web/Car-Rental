/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { usePagination } from "../../utils/Pagination";
import { useDebouncedValue } from "../../utils/useDebounce";
import { supabaseWater as supabase } from "../../utils/supabase";
import { filterData } from "../../utils/FilterData";
import { formatDate } from "../../utils/timeFormatter";
import Card from "../../components/Card";
import icons from "../../constants/icon";
import { SearchBar } from "../../components";
import DeleteModal from "../../modals/DeleteModal";
import WaterOrderForm, { type WaterOrderData } from "./components/Waterorderform";
import WaterCustomerForm, { type WaterCustomerData } from "./components/Watercustomerform";


// A customer plus the numbers from the `water_customer_summary` view
interface CustomerRow extends WaterCustomerData {
  completed_orders: number;
  total_delivered: number;
  jugs_on_hand: number;
  unpaid_balance: number;
  last_delivery: string | null;
}

const WaterCustomerProfile = () => {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [allCustomers, setAllCustomers] = useState<CustomerRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit" | "view">("view");
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);

  // New order for a customer
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderCustomerId, setOrderCustomerId] = useState<string | null>(null);

  // Order history of the clicked customer
  const [history, setHistory] = useState<WaterOrderData[]>([]);
  const [historyCustomer, setHistoryCustomer] = useState<CustomerRow | null>(null);

  const {
    currentPage,
    setCurrentPage,
    currentItems,
    totalPages,
    indexOfFirstItem,
    indexOfLastItem,
    itemsPerPage,
    setItemsPerPage,
  } = usePagination(customers, 5);

  const historyPagination = usePagination(history, 5);
  const debounceSearchTerm = useDebouncedValue(searchTerm, 200);

  /* ---------------- Fetch ---------------- */
  const fetchCustomers = useCallback(async () => {
    const [custRes, sumRes] = await Promise.all([
      supabase
        .from("water_customer")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase.from("water_customer_summary").select("*"),
    ]);

    if (custRes.error || sumRes.error) {
      const message = (custRes.error || sumRes.error)?.message;
      console.error("water customers error:", custRes.error || sumRes.error);
      toast.error(`Error fetching customers: ${message}`);
      return;
    }

    const summaries = new Map<string, any>(
      (sumRes.data || []).map((s: any) => [s.customer_id, s]),
    );

    const rows: CustomerRow[] = (custRes.data || []).map((c: WaterCustomerData) => {
      const s = summaries.get(c.id);
      return {
        ...c,
        completed_orders: Number(s?.completed_orders) || 0,
        total_delivered: Number(s?.total_delivered) || 0,
        jugs_on_hand: Number(s?.jugs_on_hand) || 0,
        unpaid_balance: Number(s?.unpaid_balance) || 0,
        last_delivery: s?.last_delivery ?? null,
      };
    });

    setCustomers(rows);
    setAllCustomers(rows);
  }, []);

  useEffect(() => {
    fetchCustomers();

    // Orders change the numbers, so refresh when they do
    const channel = supabase
      .channel("water-customers-db")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "water_order" },
        () => fetchCustomers(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCustomers]);

  /* ---------------- Search ---------------- */
  useEffect(() => {
    setCustomers(
      filterData(debounceSearchTerm, allCustomers, [
        "full_name",
        "address",
        "phone_number",
        "notes",
      ]),
    );
    setCurrentPage(1);
  }, [debounceSearchTerm, allCustomers, setCurrentPage]);

  /* ---------------- History ---------------- */
  const historyId = historyCustomer?.id;

  const fetchHistory = useCallback(async () => {
    if (!historyId) return;

    const { data, error } = await supabase
      .from("water_order")
      .select("*")
      .eq("customer_id", historyId)
      .is("deleted_at", null)
      .order("delivery_date", { ascending: false });

    if (error) {
      console.error("water history error:", error);
      toast.error("Failed to load customer history");
      return;
    }
    setHistory(data || []);
    historyPagination.setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  /* ---------------- Delete (soft) ---------------- */
  const handleDelete = async () => {
    if (!selectedCustomer) return;

    try {
      // Don't remove someone who still has a delivery coming
      const { count, error: countError } = await supabase
        .from("water_order")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", selectedCustomer.id)
        .in("status", ["Scheduled", "On Delivery"])
        .is("deleted_at", null);
      if (countError) throw countError;

      if ((count ?? 0) > 0) {
        toast.error(
          `${selectedCustomer.full_name} still has ${count} pending order(s). Complete or cancel them first.`,
        );
        setOpenDelete(false);
        return;
      }

      const { error } = await supabase
        .from("water_customer")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", selectedCustomer.id);
      if (error) throw error;

      if (historyCustomer?.id === selectedCustomer.id) {
        setHistoryCustomer(null);
        setHistory([]);
      }

      toast.success("Customer moved to Trash");
      setOpenDelete(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to delete");
    }
  };

  const totalJugsOut = allCustomers.reduce((sum, c) => sum + c.jugs_on_hand, 0);

  const headerClass =
    "p-4 text-[11px] font-bold text-slate-500 uppercase text-center";

  return (
    <div className="min-h-screen w-full pt-10 px-6 bg-[#f8fafc] flex flex-col gap-6 pb-10">
      {/* Metrics */}
      <div className="flex gap-4">
        <Card
          className="bg-white border border-slate-200 shadow-sm w-full transition-transform hover:scale-[1.01]"
          title={
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Total Customers
            </span>
          }
          url={""}
          amount={
            <span className="text-5xl font-bold text-slate-800">
              {allCustomers.length}
            </span>
          }
          description="Registered in the database"
          topIcon={
            <p className="p-3 bg-blue-50 rounded-xl">
              <icons.person className="text-blue-600 text-2xl" />
            </p>
          }
        />
        <Card
          className="bg-white border border-slate-200 shadow-sm w-full transition-transform hover:scale-[1.01]"
          title={
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Jugs Out
            </span>
          }
          url={""}
          amount={
            <span className="text-5xl font-bold text-emerald-500">
              {totalJugsOut}
            </span>
          }
          description="Gallons currently held by customers"
          topIcon={
            <p className="p-3 bg-emerald-50 rounded-xl">
              <icons.water className="text-emerald-600 text-2xl" />
            </p>
          }
        />
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-slate-700">Customer Database</h2>
          <button
            onClick={() => {
              setFormMode("create");
              setSelectedCustomer(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-md"
          >
            <icons.add size={16} /> New Customer
          </button>
        </div>
        <div className="w-full sm:w-72">
          <SearchBar
            onClear={() => setSearchTerm("")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2.5 px-4 border border-slate-200 bg-slate-50 text-slate-700 rounded-lg outline-none"
            placeholder="Search Customer Details..."
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-left min-w-[1200px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className={`w-16 ${headerClass}`}>No</th>
                <th className={headerClass}>Customer Name</th>
                <th className={headerClass}>Address</th>
                <th className={headerClass}>Phone #</th>
                <th className={headerClass}>Orders</th>
                <th className={headerClass}>Delivered</th>
                <th className={headerClass}>Jugs On Hand</th>
                <th className={headerClass}>Unpaid</th>
                <th className={headerClass}>Last Delivery</th>
                <th className={headerClass}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-sm text-slate-400 font-medium">
                    No customers found
                  </td>
                </tr>
              ) : (
                currentItems.map((row, index) => (
                  <tr
                    key={row.id}
                    onClick={() => setHistoryCustomer(row)}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                  >
                    <td className="p-4 text-center text-xs font-semibold text-slate-400">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="p-4 text-center text-xs font-bold text-slate-800">
                      {row.full_name || "N/A"}
                    </td>
                    <td className="p-4 text-center text-xs text-slate-600 truncate max-w-[180px]">
                      {row.address || "N/A"}
                    </td>
                    <td className="p-4 text-center text-xs font-mono text-slate-500">
                      {row.phone_number || "N/A"}
                    </td>
                    <td className="p-4 text-center text-xs font-bold text-slate-700">
                      {row.completed_orders}
                    </td>
                    <td className="p-4 text-center text-xs font-bold text-slate-700">
                      {row.total_delivered}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                          row.jugs_on_hand > 0
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : "bg-slate-50 text-slate-400 border-slate-100"
                        }`}
                      >
                        {row.jugs_on_hand}
                      </span>
                    </td>
                    <td
                      className={`p-4 text-center text-xs font-bold ${
                        row.unpaid_balance > 0 ? "text-red-500" : "text-slate-400"
                      }`}
                    >
                      ₱{row.unpaid_balance.toLocaleString()}
                    </td>
                    <td className="p-4 text-center text-xs text-slate-600">
                      {row.last_delivery ? formatDate(row.last_delivery) : "N/A"}
                    </td>
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => {
                            setOrderCustomerId(row.id);
                            setShowOrderForm(true);
                          }}
                          className="px-3 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-[11px] font-bold"
                        >
                          Order
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCustomer(row);
                            setFormMode("view");
                            setShowForm(true);
                          }}
                          className="p-2 bg-white border border-slate-200 rounded-lg text-emerald-600"
                        >
                          <icons.openEye />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCustomer(row);
                            setFormMode("edit");
                            setShowForm(true);
                          }}
                          className="p-2 bg-white border border-slate-200 rounded-lg text-blue-600"
                        >
                          <icons.edit />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCustomer(row);
                            setOpenDelete(true);
                          }}
                          className="p-2 bg-white border border-slate-200 rounded-lg text-red-500"
                        >
                          <icons.trash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold"
          >
            {[5, 10, 20].map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
          <p className="text-xs font-semibold text-slate-500">
            Showing {customers.length === 0 ? 0 : indexOfFirstItem + 1}-
            {Math.min(indexOfLastItem, customers.length)} of {customers.length}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="px-4 py-2 text-xs font-bold bg-white border rounded-xl disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
            {currentPage} / {totalPages || 1}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="px-4 py-2 text-xs font-bold bg-white border rounded-xl disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* Order history of the clicked customer */}
      {historyCustomer && (
        <div className="mt-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-xl animate-in slide-in-from-bottom-5">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-800">Order History</h2>
              <p className="text-sm text-blue-500 font-bold uppercase">
                {historyCustomer.full_name}
                {historyCustomer.phone_number ? ` — ${historyCustomer.phone_number}` : ""}
              </p>
            </div>
            <button
              onClick={() => {
                setHistoryCustomer(null);
                setHistory([]);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold"
            >
              Close View
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-center table-fixed">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="p-4 text-[10px] uppercase">Delivery</th>
                  <th className="p-4 text-[10px] uppercase">Product</th>
                  <th className="p-4 text-[10px] uppercase">Qty</th>
                  <th className="p-4 text-[10px] uppercase">Empties</th>
                  <th className="p-4 text-[10px] uppercase">Total</th>
                  <th className="p-4 text-[10px] uppercase">Payment</th>
                  <th className="p-4 text-[10px] uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-xs font-semibold text-slate-400">
                      No orders found for this customer
                    </td>
                  </tr>
                ) : (
                  historyPagination.currentItems.map((order) => (
                    <tr key={order.id}>
                      <td className="p-4 font-bold text-sm">
                        {formatDate(order.delivery_date)}
                      </td>
                      <td className="p-4 font-bold text-sm">{order.product_name}</td>
                      <td className="p-4 font-bold text-sm">{order.quantity}</td>
                      <td className="p-4 font-bold text-sm">
                        {order.status === "Completed" ? order.empties_returned : "—"}
                      </td>
                      <td className="p-4 font-bold text-sm">
                        ₱{(Number(order.total_price) || 0).toLocaleString()}
                      </td>
                      <td
                        className={`p-4 font-bold text-sm ${
                          order.payment_status === "Paid"
                            ? "text-emerald-600"
                            : "text-red-500"
                        }`}
                      >
                        {order.payment_status}
                      </td>
                      <td className="p-4 font-bold text-sm">{order.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500">
              Showing {history.length === 0 ? 0 : historyPagination.indexOfFirstItem + 1}-
              {Math.min(historyPagination.indexOfLastItem, history.length)} of{" "}
              {history.length}
            </p>
            <div className="flex items-center gap-3">
              <button
                disabled={historyPagination.currentPage === 1}
                onClick={() => historyPagination.setCurrentPage((prev) => prev - 1)}
                className="px-4 py-2 text-xs font-bold bg-white border rounded-xl disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
                {historyPagination.currentPage} / {historyPagination.totalPages || 1}
              </span>
              <button
                disabled={historyPagination.currentPage >= historyPagination.totalPages}
                onClick={() => historyPagination.setCurrentPage((prev) => prev + 1)}
                className="px-4 py-2 text-xs font-bold bg-white border rounded-xl disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <WaterCustomerForm
        open={showForm}
        mode={formMode}
        selectedData={selectedCustomer}
        onClose={() => setShowForm(false)}
        onSuccess={() => {
          fetchCustomers();
          fetchHistory();
        }}
      />

      <WaterOrderForm
        open={showOrderForm}
        mode="create"
        presetCustomerId={orderCustomerId}
        onClose={() => {
          setShowOrderForm(false);
          setOrderCustomerId(null);
        }}
        onSuccess={() => {
          fetchCustomers();
          fetchHistory();
        }}
      />

      {openDelete && (
        <DeleteModal
          open={openDelete}
          onClose={() => setOpenDelete(false)}
          onClick={handleDelete}
        />
      )}
    </div>
  );
};

export default WaterCustomerProfile;