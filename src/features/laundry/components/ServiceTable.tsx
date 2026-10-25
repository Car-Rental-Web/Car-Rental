/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { supabaseLaundry as supabase } from "../../../utils/supabase";
import { filterData } from "../../../utils/FilterData";
import { useDebouncedValue } from "../../../utils/useDebounce";
import { usePagination } from "../../../utils/Pagination";
import { syncMachineStatus } from "../../../utils/laundry/syncMachineStatus";
import { formatDateandDay, to12Hour } from "../../../utils/timeFormatter";
import ServiceBookingForm, {
  BOOKING_STATUSES,
  type LaundryBookingData,
} from "../components/ServiceBookingForm";
import icons from "../../../constants/icon";
import SearchBar from "../../../components/SearchBar";
import DeleteModal from "../../../modals/DeleteModal";

interface ServiceTableProps {
  /** Heading shown at the top, e.g. "On Reservation" */
  title: string;
  /** Which statuses this table shows. Leave out to show every booking. */
  statuses?: string[];
  /** Sort newest first (handy for Completed). Default: soonest first. */
  newestFirst?: boolean;
}

const headerCell =
  "p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center";

const ServiceTable = ({
  title,
  statuses,
  newestFirst = false,
}: ServiceTableProps) => {
  // `statuses` is usually an inline array, so compare by value, not identity
  const statusKey = statuses?.join("|") ?? "";
  const statusList = useMemo(
    () => (statusKey ? statusKey.split("|") : undefined),
    [statusKey],
  );

  // allBookings = source of truth from the DB, bookings = filtered view
  const [allBookings, setAllBookings] = useState<LaundryBookingData[]>([]);
  const [bookings, setBookings] = useState<LaundryBookingData[]>([]);

  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const debounceSearchTerm = useDebouncedValue(searchTerm, 200);

  const [openForm, setOpenForm] = useState(false);
  const [formMode, setFormMode] = useState<"edit" | "view">("view");
  const [openDelete, setOpenDelete] = useState(false);
  const [selected, setSelected] = useState<LaundryBookingData | null>(null);

  const {
    currentPage,
    setCurrentPage,
    currentItems,
    totalPages,
    indexOfFirstItem,
    indexOfLastItem,
    itemsPerPage,
    setItemsPerPage,
  } = usePagination(bookings, 5);

  // The status dropdown only makes sense when there is more than one to pick
  const statusOptions = statusList ?? BOOKING_STATUSES;
  const showStatusFilter = statusOptions.length > 1;

  /* ---------------- Fetch + live updates ---------------- */
  const fetchBookings = useCallback(async () => {
    let query = supabase.from("laundry_booking").select("*");
    if (statusList) query = query.in("status", statusList);

    const { data, error } = await query
      .order("start_date", { ascending: !newestFirst })
      .order("start_time", { ascending: !newestFirst });

    if (error) {
      console.error("laundry_booking error:", error);
      toast.error(`Error fetching bookings: ${error.message}`);
      return;
    }
    setAllBookings(data || []);
  }, [statusList, newestFirst]);

  useEffect(() => {
    setSelectedStatus("All");
    setSearchTerm("");
    fetchBookings();

    // Any change refetches, so a booking that changes status
    // moves to the right table on its own.
    const channel = supabase
      .channel(`laundry-booking-${statusKey || "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "laundry_booking" },
        () => fetchBookings(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBookings, statusKey]);

  /* ---------------- Search + status filter ---------------- */
  useEffect(() => {
    let filtered = [...allBookings];

    if (selectedStatus !== "All") {
      filtered = filtered.filter((item) => item.status === selectedStatus);
    }

    if (debounceSearchTerm) {
      filtered = filterData(debounceSearchTerm, filtered, [
        "full_name",
        "address",
        "phone_number",
        "laundry_service",
        "machine_name",
        "type_of_service",
        "start_date",
        "end_date",
      ]);
    }

    setBookings(filtered);
    setCurrentPage(1);
  }, [debounceSearchTerm, allBookings, selectedStatus, setCurrentPage]);

  /* ---------------- Actions ---------------- */
  const handleAction = (mode: "view" | "edit", row: LaundryBookingData) => {
    setFormMode(mode);
    setSelected(row);
    setOpenForm(true);
  };

  const handleDelete = async () => {
    if (!selected) return;

    try {
      const { error } = await supabase
        .from("laundry_booking")
        .delete()
        .eq("id", selected.id);
      if (error) throw error;

      // The machine may be free again now
      await syncMachineStatus(selected.machine_id);

      // Remove the proof image from storage
      if (selected.uploaded_proof) {
        const path = selected.uploaded_proof.split("uploaded_proof/")[1];
        if (path) await supabase.storage.from("uploaded_proof").remove([path]);
      }

      // Keep the customer's service count honest
      try {
        let customerId = selected.customer_id;

        // Older bookings have no customer_id: fall back to an exact
        // name + phone match, but only when it is unambiguous
        if (!customerId && selected.full_name) {
          let q = supabase
            .from("customer_profile")
            .select("id")
            .eq("full_name", selected.full_name)
            .is("deleted_at", null);
          q = selected.phone_number
            ? q.eq("phone_number", selected.phone_number)
            : q.is("phone_number", null);

          const { data: matches } = await q;
          if (matches?.length === 1) customerId = matches[0].id;
        }

        if (customerId) {
          const { data: customer } = await supabase
            .from("customer_profile")
            .select("times_service")
            .eq("id", customerId)
            .single();

          await supabase
            .from("customer_profile")
            .update({
              times_service: Math.max((customer?.times_service ?? 0) - 1, 0),
            })
            .eq("id", customerId);
        }
      } catch (statsError) {
        console.error("customer stats error:", statsError);
      }

      toast.success(`Booking deleted: ${selected.full_name ?? ""}`);
      setOpenDelete(false);
      setSelected(null);
      fetchBookings();
    } catch (error: any) {
      console.error("Failed to delete:", error);
      toast.error(error.message || "Failed to delete booking");
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
            Monitoring {bookings.length} total bookings
          </p>
        </div>

        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
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
              placeholder="Search Booking Details..."
            />
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-left min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className={headerCell}>No</th>
                <th className={headerCell}>Customer Information</th>
                <th className={headerCell}>Contact</th>
                <th className={headerCell}>Machine</th>
                <th className={headerCell}>Service</th>
                <th className={headerCell}>Price</th>
                <th className={headerCell}>Type</th>
                <th className={headerCell}>Schedule</th>
                <th className={headerCell}>Duration</th>
                <th className={headerCell}>Status</th>
                <th className={headerCell}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.length > 0 ? (
                currentItems.map((row, index) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 text-center text-sm font-bold text-slate-800">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col text-center">
                        <span className="text-sm font-bold text-slate-800">
                          {row.full_name}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[250px] mx-auto">
                          {row.address}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center text-xs font-mono text-slate-700">
                      {row.phone_number || "N/A"}
                    </td>
                    <td className="p-4 text-center text-xs font-bold text-slate-800">
                      {row.machine_name || "N/A"}
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-xs font-bold text-blue-600">
                        {row.laundry_service}
                      </span>
                    </td>
                    <td className="p-4 text-center text-xs font-black text-emerald-600">
                      ₱{(Number(row.price) || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-center text-xs font-black text-slate-700">
                      {row.type_of_service}
                    </td>
                    <td className="p-4 text-center">
                      <div className="text-xs font-medium text-slate-700">
                        {row.start_date ? formatDateandDay(row.start_date) : "N/A"}{" "}
                        <span className="text-slate-300">|</span>{" "}
                        {row.end_date ? formatDateandDay(row.end_date) : "N/A"}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {row.start_time ? to12Hour(row.start_time) : "--"} -{" "}
                          {row.end_time ? to12Hour(row.end_time) : "--"}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center text-xs font-black text-slate-700">
                      {row.duration}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center">
                        <span
                          className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter shadow-sm border
                          ${
                            row.status === "Completed"
                              ? "bg-red-500 text-red-100 border-red-400"
                              : row.status === "On Service"
                                ? "bg-emerald-500 text-emerald-100 border-emerald-400"
                                : row.status === "On Reservation"
                                  ? "bg-blue-500 text-blue-100 border-blue-400"
                                  : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
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
                            <span className="text-slate-900 font-bold">
                              "{searchTerm}"
                            </span>{" "}
                            in{" "}
                            <span className="text-slate-900 font-bold">
                              {selectedStatus}
                            </span>
                          </>
                        ) : searchTerm.length > 0 ? (
                          <>
                            No results found for{" "}
                            <span className="text-slate-900 font-bold">
                              "{searchTerm}"
                            </span>
                          </>
                        ) : selectedStatus !== "All" ? (
                          <>
                            No bookings currently{" "}
                            <span className="text-slate-900 font-bold">
                              {selectedStatus}
                            </span>
                          </>
                        ) : (
                          "No bookings found."
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
            <span className="text-xs font-bold text-slate-400 uppercase">
              Show
            </span>
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
              {bookings.length === 0 ? 0 : indexOfFirstItem + 1}-
              {Math.min(indexOfLastItem, bookings.length)}
            </span>{" "}
            of <span className="text-slate-900">{bookings.length}</span>
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
            {currentPage} <span className="text-blue-300 mx-1">/</span>{" "}
            {totalPages || 1}
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
      <ServiceBookingForm
        open={openForm}
        mode={formMode}
        booking={selected}
        onClose={() => {
          setOpenForm(false);
          setSelected(null);
        }}
        onSuccess={fetchBookings}
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

export default ServiceTable;