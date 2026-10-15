/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { usePagination } from "../../utils/Pagination";
import { useDebouncedValue } from "../../utils/useDebounce";
import { supabaseLaundry as supabase } from "../../utils/supabase";
import { filterData } from "../../utils/FilterData";
import Card from "../../components/Card";
import icons from "../../constants/icon";
import { SearchBar } from "../../components";
import { DeleteModal } from "../../modals";
import { formatDate } from "../../utils/timeFormatter";
import CustomerForm from "./components/CustomerForm";

// Matches the columns of the `customer_profile` table
export interface CustomerProfileData {
  id: string; // uuid
  created_at: string;
  full_name: string | null;
  times_service: number | null;
  last_date_service: string | null;
  notes: string | null;
  address: string | null;
  phone_number: string | null;
  valid_id: string | null;
  e_signature: string | null;
  deleted_at: string | null;
}

// Matches the columns of the `laundry_booking` table
interface LaundryBookingData {
  id: string;
  created_at: string;
  full_name: string | null;
  address: string | null;
  phone_number: string | null;
  laundry_service: string | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  type_of_service: string | null;
  duration: string | null;
  status: string | null;
}

// Local inline fallback image — no network request, so it can never itself fail.
const FALLBACK_AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <rect width="40" height="40" fill="#e2e8f0"/>
      <circle cx="20" cy="15" r="7" fill="#94a3b8"/>
      <path d="M6 36c0-8 6-13 14-13s14 5 14 13" fill="#94a3b8"/>
    </svg>`,
  );

const CustomerProfile = () => {
  const [customers, setCustomers] = useState<CustomerProfileData[]>([]);
  const [allCustomers, setAllCustomers] = useState<CustomerProfileData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "view" | "edit">("view");
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerProfileData | null>(null);

  // Booking history of the clicked customer
  const [bookingHistory, setBookingHistory] = useState<LaundryBookingData[]>(
    [],
  );
  const [selectedName, setSelectedName] = useState("");
  const [selectedPhone, setSelectedPhone] = useState("");

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

  const historyPagination = usePagination(bookingHistory, 5);
  const debounceSearchTerm = useDebouncedValue(searchTerm, 200);

  // Fetch Logic
  const fetchCustomers = useCallback(async () => {
    const { data, error } = await supabase
      .from("customer_profile")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error fetching customers");
      return;
    }

    setCustomers(data || []);
    setAllCustomers(data || []);

    // Auto-scroll to bottom of the page to see new entries
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 100);
  }, []);

  useEffect(() => {
    fetchCustomers();

    // Real-time subscription
    const subscription = supabase
      .channel("customer-profile-db")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customer_profile" },
        () => fetchCustomers(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchCustomers]);

  // Search Logic
  useEffect(() => {
    const result = filterData(debounceSearchTerm, allCustomers, [
      "full_name",
      "address",
      "phone_number",
    ]);
    setCustomers(result);
    setCurrentPage(1);
  }, [debounceSearchTerm, allCustomers, setCurrentPage]);

  // History Logic
  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedName) return;

      // Wildcard pattern from the name words so spacing differences
      // (single vs double space, etc.) don't break the match.
      const namePattern = `%${selectedName
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .join("%")}%`;

      const { data, error } = await supabase
        .from("laundry_booking")
        .select("*")
        .ilike("full_name", namePattern)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("laundry_booking error:", error);
        toast.error("Failed to load customer history");
        return;
      }

      setBookingHistory(data || []);
      historyPagination.setCurrentPage(1);
    };

    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedName]);

  const handleDelete = async (id: string) => {
    if (!selectedCustomer) return;

    try {
      // 1. Soft delete from database
      const { error: deleteError } = await supabase
        .from("customer_profile")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (deleteError) throw deleteError;

      // 2. Cleanup storage
      const getFileName = (url: string) => url?.split("/").pop();

      const filesToRemove: { bucket: string; path: string }[] = [];
      if (selectedCustomer.valid_id)
        filesToRemove.push({
          bucket: "valid_id",
          path: getFileName(selectedCustomer.valid_id)!,
        });
      if (selectedCustomer.e_signature)
        filesToRemove.push({
          bucket: "e_signature",
          path: getFileName(selectedCustomer.e_signature)!,
        });

      await Promise.allSettled(
        filesToRemove.map((file) =>
          supabase.storage.from(file.bucket).remove([file.path]),
        ),
      );

      toast.success("Customer moved to Trash");
      setOpenDelete(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to delete");
    }
  };

  const headerClass =
    "p-4 text-[11px] font-bold text-slate-500 uppercase text-center";

  return (
    <div className="min-h-screen w-full pt-10 px-6 bg-[#f8fafc] flex flex-col gap-6 pb-10">
      {/* Metrics Cards */}
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
          description="Total registered in database"
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
              Current Records
            </span>
          }
          url={""}
          amount={
            <span className="text-5xl font-bold text-emerald-500">
              {customers.length}
            </span>
          }
          description="Customer entries found"
          topIcon={
            <p className="p-3 bg-emerald-50 rounded-xl">
              <icons.laundry className="text-emerald-600 text-2xl" />
            </p>
          }
        />
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-slate-700">
            Customer Database
          </h2>
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

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-left min-w-[1300px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className={`w-16 ${headerClass}`}>ID</th>
                <th className={headerClass}>Created</th>
                <th className={headerClass}>Customer Name</th>
                <th className={headerClass}>Address</th>
                <th className={headerClass}>Phone #</th>
                <th className={headerClass}>Times Serviced</th>
                <th className={headerClass}>Last Service</th>
                <th className={headerClass}>Notes</th>
                <th className={headerClass}>Valid ID</th>
                <th className={headerClass}>Signature</th>
                <th className={headerClass}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.map((row, index) => (
                <tr
                  key={row.id}
                  onClick={() => {
                    setSelectedName(row.full_name || "");
                    setSelectedPhone(row.phone_number || "");
                  }}
                  className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                >
                  <td className="p-4 text-center text-xs font-semibold text-slate-400">
                    {indexOfFirstItem + index + 1}
                  </td>
                  <td className="p-4 text-center text-xs text-slate-600">
                    {row.created_at.split("T")[0]}
                  </td>
                  <td className="p-4 text-center text-xs font-bold text-slate-800">
                    {row.full_name || "N/A"}
                  </td>
                  <td className="p-4 text-center text-xs text-slate-600 truncate max-w-[150px]">
                    {row.address || "N/A"}
                  </td>
                  <td className="p-4 text-center text-xs font-mono text-slate-500">
                    {row.phone_number || "N/A"}
                  </td>
                  <td className="p-4 text-center text-xs font-bold text-slate-700">
                    {row.times_service ?? 0}
                  </td>
                  <td className="p-4 text-center text-xs text-slate-600">
                    {row.last_date_service || "N/A"}
                  </td>
                  <td className="p-4 text-center text-xs text-slate-600 truncate max-w-[180px]">
                    {row.notes || "N/A"}
                  </td>
                  <td className="p-4 text-center">
                    <img
                      className="w-10 h-10 object-cover rounded-lg mx-auto"
                      src={row.valid_id || FALLBACK_AVATAR}
                      alt="Valid ID"
                      onError={(e) => {
                        if (e.currentTarget.src !== FALLBACK_AVATAR) {
                          e.currentTarget.src = FALLBACK_AVATAR;
                        }
                      }}
                    />
                  </td>
                  <td className="p-4 text-center">
                    <img
                      className="w-16 h-10 object-contain rounded-lg mx-auto bg-white border border-slate-200"
                      src={row.e_signature || FALLBACK_AVATAR}
                      alt="Signature"
                      onError={(e) => {
                        if (e.currentTarget.src !== FALLBACK_AVATAR) {
                          e.currentTarget.src = FALLBACK_AVATAR;
                        }
                      }}
                    />
                  </td>
                  <td
                    className="p-4 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex gap-2 justify-center">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Bar */}
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

      {/* History Detail View */}
      {selectedName && (
        <div className="mt-8 p-6 bg-white border border-slate-200 rounded-2xl shadow-xl animate-in slide-in-from-bottom-5">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-800">
                Laundry Record
              </h2>
              <p className="text-sm text-blue-500 font-bold uppercase">
                {selectedName}
                {selectedPhone ? ` — ${selectedPhone}` : ""}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedName("");
                setSelectedPhone("");
                setBookingHistory([]);
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
                  <th className="p-4 text-[10px] uppercase">Service Created</th>
                  <th className="p-4 text-[10px] uppercase">Laundry Service</th>
                  <th className="p-4 text-[10px] uppercase">Type</th>
                  <th className="p-4 text-[10px] uppercase">Schedule</th>
                  <th className="p-4 text-[10px] uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookingHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-6 text-xs font-semibold text-slate-400"
                    >
                      No bookings found for this customer
                    </td>
                  </tr>
                ) : (
                  historyPagination.currentItems.map((history) => (
                    <tr key={history.id}>
                      <td className="p-4 font-bold text-sm">
                        {formatDate(history.created_at.split("T")[0])}
                      </td>
                      <td className="p-4 font-bold text-sm">
                        {history.laundry_service || "N/A"}
                      </td>
                      <td className="p-4 font-bold text-sm">
                        {history.type_of_service || "N/A"}
                      </td>
                      <td className="p-4 font-bold text-sm">
                        {history.start_date ? (
                          <>
                            <span>{formatDate(history.start_date)}</span> |{" "}
                            <span>
                              {history.end_date
                                ? formatDate(history.end_date)
                                : "N/A"}
                            </span>
                          </>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="p-4 font-bold text-sm">
                        {history.status || "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* History Pagination Bar */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500">
              Showing{" "}
              {bookingHistory.length === 0
                ? 0
                : historyPagination.indexOfFirstItem + 1}
              -
              {Math.min(
                historyPagination.indexOfLastItem,
                bookingHistory.length,
              )}{" "}
              of {bookingHistory.length}
            </p>
            <div className="flex items-center gap-3">
              <button
                disabled={historyPagination.currentPage === 1}
                onClick={() =>
                  historyPagination.setCurrentPage((prev) => prev - 1)
                }
                className="px-4 py-2 text-xs font-bold bg-white border rounded-xl disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
                {historyPagination.currentPage} /{" "}
                {historyPagination.totalPages || 1}
              </span>
              <button
                disabled={
                  historyPagination.currentPage >= historyPagination.totalPages
                }
                onClick={() =>
                  historyPagination.setCurrentPage((prev) => prev + 1)
                }
                className="px-4 py-2 text-xs font-bold bg-white border rounded-xl disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <CustomerForm
        open={showForm}
        mode={formMode}
        selectedData={selectedCustomer}
        onClose={() => setShowForm(false)}
        onSuccess={fetchCustomers}
      />
      {openDelete && (
        <DeleteModal
          open={openDelete}
          onClose={() => setOpenDelete(false)}
          onClick={() => handleDelete(selectedCustomer!.id)}
        />
      )}
    </div>
  );
};

export default CustomerProfile;