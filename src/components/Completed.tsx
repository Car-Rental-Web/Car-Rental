/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import type { DataRenterHistoryProps } from "../types/types";
import { filterData } from "../utils/FilterData";
import { useDebouncedValue } from "../utils/useDebounce";
import { SearchBar } from "../components";
import icons from "../constants/icon";
import RenterForm from "../components/RenterForm";
import { DeleteModal } from "../modals";
import { toast } from "react-toastify";
import { formatDate, to12Hour } from "../utils/timeFormatter";

const Completed = () => {
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit" | "view">(
    "create",
  );
  const [selectedData, setSelectedData] =
    useState<DataRenterHistoryProps | null>(null);

  // renterData is what is currently displayed (filtered/paged)
  const [renterData, setRenterData] = useState<DataRenterHistoryProps[]>([]);
  // filterRenterData acts as the "Source of Truth" from the database
  const [filterRenterData, setFilterRenterData] = useState<
    DataRenterHistoryProps[]
  >([]);

  const [selectedStatus, setSelectedStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");

  const debounceSearchTerm = useDebouncedValue(searchTerm, 200);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = renterData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(renterData.length / itemsPerPage);

  const handleAction = (mode: "create" | "view" | "edit", data: any) => {
    setFormMode(mode);
    setSelectedData(data);
    setOpenForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const { data: booking, error: fetchError } = await supabase
        .from("renter_booking")
        .select("uploaded_proof, car_plate_number")
        .eq("id", id)
        .maybeSingle();

      if (fetchError || !booking) {
        toast.error("Booking not found");
        return;
      }

      const storageTasks: Promise<any>[] = [];
      if (booking.uploaded_proof && booking.uploaded_proof.length > 0) {
        const proofPaths = Array.isArray(booking.uploaded_proof)
          ? booking.uploaded_proof
          : JSON.parse(booking.uploaded_proof);

        storageTasks.push(
          supabase.storage.from("uploaded_proof").remove(proofPaths),
        );
      }

      await Promise.all(storageTasks);

      const { error: deleteError } = await supabase
        .from("renter_booking")
        .update({deleted_at: new Date().toISOString()})
        .eq("id", id);

        if(deleteError) {
          toast.error("Failed to Move to Trash")
        }

      toast.success(`"Moved to Trash Successfully" ${booking.car_plate_number}`);
      await supabase
        .from("vehicle")
        .update({ status: "Available" })
        .eq("plate_number", booking.car_plate_number);

      setOpenDelete(false);
      setSelectedData(null);
      // Update local state source of truth
      setFilterRenterData((prev) => prev.filter((row) => row.id !== id));
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Failed to delete everything");
    }
  };

  // Fetch data and setup subscription
  useEffect(() => {
    const fetchRenter = async () => {
       const statusFilter = "Completed";
      const { data, error } = await supabase
        .from("renter_booking")
        .select("*")
        .eq("status", statusFilter)
        .order("id", { ascending: false })
        .is("deleted_at", null)
      if (error) {
        console.log("Error fetching renter", error);
        return;
      }
      setRenterData(data);
      setFilterRenterData(data);
    };
    fetchRenter();

    const subscription = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "renter_booking" },
        (payload) => {
          const eventType = payload.eventType;
          if (eventType === "INSERT") {
            const newData = payload.new as DataRenterHistoryProps;
            setFilterRenterData((prev) => [newData, ...prev]);
          } else if (eventType === "UPDATE") {
            const updatedData = payload.new as DataRenterHistoryProps;
            setFilterRenterData((prev) =>
              prev.map((item) =>
                item.id === updatedData.id ? updatedData : item,
              ),
            );
            setSelectedData((current) => current?.id === updatedData.id ? updatedData : current);
          } else if (eventType === "DELETE") {
            setFilterRenterData((prev) =>
              prev.filter((item) => item.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [openForm]);

  // Combined Filtering Logic (Search + Status)
  useEffect(() => {
    let filtered = [...filterRenterData];

    if (selectedStatus !== "All") {
      filtered = filtered.filter((item) => item.status === selectedStatus);
    }

    if (debounceSearchTerm) {
      filtered = filterData(debounceSearchTerm, filtered, [
        "full_name",
        "address",
        "license_number",
        "car_plate_number",
        "start_date",
        "end_date",
      ]);
    }

    setRenterData(filtered);
    setCurrentPage(1);
  }, [debounceSearchTerm, filterRenterData, selectedStatus]);

  return (
    <div className="min-h-screen bg-slate-50 w-full pt-12 px-8 flex flex-col gap-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rental History</h1>
          <p className="text-sm text-slate-500 font-medium">
            Monitoring {renterData.length} total bookings
          </p>
        </div>

        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
          {/* Status Filter */}
          <div className="relative min-w-[180px]">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2.5 px-4 bg-white border border-slate-200 shadow-sm text-sm font-semibold text-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="On Reservation">On Reservation</option>
              <option value="On Service">On Service</option>
              <option value="Completed">Completed</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <icons.filter size={14} />
            </div>
          </div>

          {/* Search Bar */}
          <div className="w-full md:w-80">
            <SearchBar
              onClear={() => setSearchTerm("")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2.5 px-4 bg-white border border-slate-200 shadow-sm text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Search Renter Details..."
            />
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ">
        <div className="overflow-x-auto">
          <table className=" w-full table-auto text-left min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  No
                </th>
                <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  Renter Information
                </th>
                <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  Identity
                </th>
                <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  Vehicle
                </th>
                <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  Schedule
                </th>
                <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  Duration
                </th>
                 <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  Rent Type
                </th>
                <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  Location
                </th>
                <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  Total Price
                </th>
                <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  Downpayment
                </th>
                <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  Balance
                </th>
                <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  Status
                </th>
                <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  Actions
                </th>
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
                    <td className="p-4 text-center">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-500">
                          License:
                        </span>
                        <span className="text-xs font-mono text-slate-700">
                          {row.license_number}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-xs font-bold text-blue-600">
                        {row.car_plate_number}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="text-xs font-medium text-slate-700">
                        {formatDate(row.start_date)}{" "}
                        <span className="text-slate-300">|</span>{" "}
                        {formatDate(row.end_date)}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {to12Hour(row.start_time)} - {to12Hour(row.end_time)}
                        </div>
                         <div className="text-xs text-red-500 text-left text-ellipsis" >
                        <strong className="text-black">Remarks:</strong> {row.remarks || ""} 
                      </div>
                      </div>
                    </td>
                    <td className="p-4 text-center text-xs font-black text-slate-700">
                      {row.duration} day/s
                    </td>
                    <td className="p-4 text-center text-xs font-black text-slate-700">
                      {row.type_of_rent}
                    </td>
                    <td className="p-4 text-center text-xs font-black text-slate-700">
                      {row.location}
                    </td>
                    <td className="p-4 text-center text-xs font-black text-slate-700">
                      {row.total_price_rent}
                    </td>
                    <td className="p-4 text-center text-xs font-black text-slate-700">
                      {row.downpayment}
                    </td>
                    <td className="p-4 text-center text-xs font-black text-red-500">
                      {row.remaining_balance}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedData(row);
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
                  <td colSpan={13} className="p-20 text-center">
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
                          "No rental history records found."
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

      {/* Pagination Container */}
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
              {renterData.length === 0 ? 0 : indexOfFirstItem + 1}-
              {Math.min(indexOfLastItem, renterData.length)}
            </span>{" "}
            of <span className="text-slate-900">{renterData.length}</span>
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

      <RenterForm
        open={openForm}
        mode={formMode}
        selectedData={selectedData}
        onClose={() => setOpenForm(false)}
      />

      {openDelete && selectedData && (
        <DeleteModal
          onClose={() => {
            setOpenDelete(false);
            setSelectedData(null);
          }}
          onClick={() => handleDelete(selectedData.id)}
          open={openDelete}
        />
      )}
    </div>
  );
};

export default Completed;
