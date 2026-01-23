import { useEffect, useState, useCallback } from "react";
import type { DataRenterHistoryProps } from "../types/types";
import { supabase } from "../utils/supabase";
import { SearchBar } from "../components";
import icons from "../constants/icon";
import { useDebouncedValue } from "../utils/useDebounce";
import { filterData } from "../utils/FilterData";
import { toast } from "react-toastify";
import { DeleteModal } from "../modals";
import RenterForm from "../components/RenterForm";
import ProfileForm from "../components/ProfileForm";
import { usePagination } from "../utils/Pagination";
import Card from "../components/Card";

const RenterProfile = () => {
  const [renterData, setRenterData] = useState<DataRenterHistoryProps[]>([]);
  const [filterRenterData, setFilterRenterData] = useState<
    DataRenterHistoryProps[]
  >([]);
  const [renterHistory, setRenterHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal Control States
  const [showRegForm, setShowRegForm] = useState(false); 
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "view" | "edit">("view");
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedRenter, setSelectedRenter] =
    useState<DataRenterHistoryProps | null>(null);
  const [selectedName, setSelectedName] = useState("");

  const mainPagination = usePagination(renterData, 5);
  const {
    currentPage,
    setCurrentPage,
    currentItems,
    totalPages,
    indexOfFirstItem,
    indexOfLastItem,
    itemsPerPage,
    setItemsPerPage,
  } = mainPagination;

  // Pagination for History Section
  const historyPagination = usePagination(renterHistory, 5);

  const debounceSearchTerm = useDebouncedValue(searchTerm, 200);

  // Fetch Logic
  const fetchRenter = useCallback(async () => {
    const { data, error } = await supabase
      .from("renter")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return;
    setRenterData(data || []);
    setFilterRenterData(data || []);
  }, []);
  
  useEffect(() => {
    fetchRenter();
    const subscription = supabase
      .channel("renter-db")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "renter" },
        () => fetchRenter(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchRenter]);

  // Search Logic
  useEffect(() => {
    let result = filterData(debounceSearchTerm, filterRenterData, [
      "full_name",
      "address",
      "license_number",
      "philhealth_number",
      "tin_number",
      "sss_number",
      "pagibig_number",
    ]);
    setRenterData(result);
    setCurrentPage(1);
  }, [debounceSearchTerm, filterRenterData, setCurrentPage]);

  // History Logic
  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedName) return;
      const { data } = await supabase
        .from("renter_booking")
        .select("*")
        .eq("full_name", selectedName)
        .order("created_at", { ascending: false });
      setRenterHistory(data || []);
      historyPagination.setCurrentPage(1); // Reset to page 1 on new selection
    };
    fetchHistory();
  }, [selectedName]);

  const handleDelete = async (id: number) => {
  try {
    // 1. Fetch the renter's data first to get the file URLs
    const { data: renter, error: fetchError } = await supabase
      .from("renter")
      .select("valid_id, e_signature")
      .eq("id", id)
      .single();

    if (fetchError) throw new Error("Could not find renter data");

    // 2. Extract the file paths from the URLs
    // This assumes your URLs look like: .../public/ids/folder/filename.png
    const getPath = (url: string) => url?.split('/').slice(-1)[0]; // Gets the filename
    
    const filesToDelete = [];
    if (renter.valid_id) filesToDelete.push(getPath(renter.valid_id));
    
    // Note: If you have folders in your path, you'll need the full path after the bucket name
    // If your path is just the filename, the logic below works:

    // 3. Delete from Storage (IDs bucket)
    if (renter.valid_id) {
      const fileName = renter.valid_id.split('/').pop();
      await supabase.storage.from("valid_id").remove([fileName]);
    }

    // 4. Delete from Storage (Signatures bucket)
    if (renter.e_signature) {
      const fileName = renter.e_signature.split('/').pop();
      await supabase.storage.from("e_signature").remove([fileName]);
    }

    // 5. Finally, delete the database record
    const { error: deleteError } = await supabase
      .from("renter")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    toast.success(`"Renter and associated files deleted"`);
    setOpenDelete(false);
    fetchRenter();

  } catch (error: any) {
    console.error(error);
    toast.error(error.message || "Failed to delete");
  }
};
  return (
    <div className="min-h-screen w-full pt-10 px-6 bg-[#f8fafc] flex flex-col gap-6 pb-10">
      {/* Metrics Cards */}
      <div className="flex gap-4">
        <Card
          className="bg-white border border-slate-200 shadow-sm w-full transition-transform hover:scale-[1.01]"
          title={
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Total Renters
            </span>
          }
          url={""}
          amount={
            <span className="text-5xl font-bold text-slate-800">
              {filterRenterData.length}
            </span>
          }
          description="Total registered in database"
          topIcon={
            <div className="p-3 bg-blue-50 rounded-xl">
              <icons.person className="text-blue-600 text-2xl" />
            </div>
          }
        />
        <Card
          className="bg-white border border-slate-200 shadow-sm w-full transition-transform hover:scale-[1.01]"
          title={
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Total Records
            </span>
          }
          url={""}
          amount={
            <span className="text-5xl font-bold text-emerald-500">
              {renterData.length}
            </span>
          }
          description="Renter entries found"
          topIcon={
            <div className="p-3 bg-emerald-50 rounded-xl">
              <icons.rent className="text-emerald-600 text-2xl" />
            </div>
          }
        />
      </div>

      {/* Control Bar */}
     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4 relative">
  <div className="flex items-center gap-4">
    <h2 className="text-lg font-bold text-slate-700">Renter Database</h2>
    <button
      onClick={() => {
        setFormMode("create");
        setSelectedRenter(null);
        setShowRegForm(true);
      }}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
    >
      <icons.add size={16} /> New Registration
    </button>
  </div>

  {/* Added a container div to the search bar to stabilize its position */}
  <div className="w-full sm:w-72">
    <SearchBar
      onClear={() => setSearchTerm("")}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full py-2.5 px-4 border border-slate-200 bg-slate-50 text-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
      placeholder="Search Renter Details..."
    />
  </div>
</div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className=" w-full table-auto text-left min-w-[1200px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="w-16 p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">ID</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Created</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Renter Name</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Rents</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Address</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">License #</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">PhilHealth</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Tin No.</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">SSS No.</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Pagibig</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Valid ID</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Signature</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Add Rent</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.map((row, index) => (
                <tr key={row.id} onClick={() => setSelectedName(row.full_name)} className="hover:bg-blue-50/50 transition-colors cursor-pointer group">
                  <td className="p-4 text-center text-xs font-semibold text-slate-400">{indexOfFirstItem + index + 1}</td>
                  <td className="p-4 text-center text-xs text-slate-600">{row.created_at.split("T")[0]}</td>
                  <td className="p-4 text-center text-xs font-bold text-slate-800">{row.full_name || "N/A"}</td>
                  <td className="p-4 text-center">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-[10px] font-bold">{row.times_rented}</span>
                  </td>
                  <td className="p-4 text-center text-xs text-slate-600 truncate">{row.address || "N/A"}</td>
                  <td className="p-4 text-center text-xs font-mono text-slate-500">{row.license_number || "N/A"}</td>
                  <td className="p-4 text-center text-xs text-slate-500">{row.philhealth_number || "N/A"}</td>
                  <td className="p-4 text-center text-xs text-slate-500">{row.tin_number || "N/A"}</td>
                  <td className="p-4 text-center text-xs text-slate-500">{row.sss_number || "N/A"}</td>
                  <td className="p-4 text-center text-xs text-slate-500">{row.pagibig_number || "N/A"}</td>
                  <td className="p-4 text-center">
                    <img className="w-10 h-10 object-cover rounded-lg mx-auto border" src={row.valid_id} alt="ID" />
                  </td>
                  <td className="p-4 text-center">
                    <img className="w-10 h-10 object-contain bg-slate-50 rounded-lg mx-auto border" src={row.e_signature} alt="Sign" />
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRenter(row);
                        setShowBookingForm(true);
                      }}
                      className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-full transition-all"
                    >
                      <icons.rent size={18} />
                    </button>
                  </td>
                  <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => { setSelectedRenter(row); setFormMode("view"); setShowRegForm(true); }} className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><icons.openEye /></button>
                      <button onClick={() => { setSelectedRenter(row); setFormMode("edit"); setShowRegForm(true); }} className="p-2 text-slate-400 hover:text-amber-500 transition-colors"><icons.edit /></button>
                      <button onClick={() => { setSelectedRenter(row); setOpenDelete(true); }} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><icons.trash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <span>Showing <b>{indexOfFirstItem + 1}</b> to <b>{Math.min(indexOfLastItem, renterData.length)}</b> of <b>{renterData.length}</b></span>
            <div className="flex items-center gap-2">
              <label>Rows:</label>
              <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-white border rounded px-2 py-1 outline-none">
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <button disabled={currentPage === 1} onClick={mainPagination.goToPreviousPage} className="px-4 py-2 bg-white border rounded-lg text-xs font-semibold hover:bg-slate-100 disabled:opacity-40">Previous</button>
            <span className="text-xs font-bold text-slate-500">Page {currentPage} of {totalPages || 1}</span>
            <button disabled={currentPage >= totalPages} onClick={mainPagination.goToNextPage} className="px-4 py-2 bg-white border rounded-lg text-xs font-semibold hover:bg-slate-100 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      {/* History Detail View */}
      {selectedName && (
        <div className="mt-8 p-6 bg-white border border-slate-200 rounded-2xl shadow-xl animate-in slide-in-from-bottom-5">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-800">Rental Record</h2>
              <p className="text-sm text-blue-500 font-bold uppercase">{selectedName}</p>
            </div>
            <button
              onClick={() => setSelectedName("")}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
            >
              Close View <icons.closeModal />
            </button>
          </div>
          
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-left">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="p-4 text-[10px] uppercase font-black">Plate #</th>
                  <th className="p-4 text-[10px] uppercase font-black">Start Date</th>
                  <th className="p-4 text-[10px] uppercase font-black">End Date</th>
                  <th className="p-4 text-[10px] uppercase font-black">Type of Rent</th>
                  <th className="p-4 text-[10px] uppercase font-black text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {renterHistory.length > 0 ? (
                  historyPagination.currentItems.map((history) => (
                    <tr key={history.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold">{history.car_plate_number}</td>
                      <td className="p-4 text-xs">{history.start_date}</td>
                      <td className="p-4 text-xs">{history.end_date}</td>
                      <td className="p-4 text-xs">{history.type_of_rent}</td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${history.status === "Completed" ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}>
                          {history.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-40">
                        <icons.rent size={48} />
                        <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">No Rental History Found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* History Pagination Bar (Same Design as Main) */}
          {renterHistory.length > 0 && (
            <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-xl">
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <span>
                  Showing <b>{historyPagination.indexOfFirstItem + 1}</b> to{" "}
                  <b>{Math.min(historyPagination.indexOfLastItem, renterHistory.length)}</b> of{" "}
                  <b>{renterHistory.length}</b>
                </span>
                <div className="flex items-center gap-2">
                  <label>Rows:</label>
                  <select
                    value={historyPagination.itemsPerPage}
                    onChange={(e) => {
                      historyPagination.setItemsPerPage(Number(e.target.value));
                      historyPagination.setCurrentPage(1);
                    }}
                    className="bg-white border rounded px-2 py-1 outline-none"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <button
                  disabled={historyPagination.currentPage === 1}
                  onClick={historyPagination.goToPreviousPage}
                  className="px-4 py-2 bg-white border rounded-lg text-xs font-semibold hover:bg-slate-100 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs font-bold text-slate-500">
                  Page {historyPagination.currentPage} of {historyPagination.totalPages || 1}
                </span>
                <button
                  disabled={historyPagination.currentPage >= historyPagination.totalPages}
                  onClick={historyPagination.goToNextPage}
                  className="px-4 py-2 bg-white border rounded-lg text-xs font-semibold hover:bg-slate-100 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      <ProfileForm open={showRegForm} mode={formMode} selectedData={selectedRenter} onClose={() => setShowRegForm(false)} onSuccess={fetchRenter} />
      <RenterForm open={showBookingForm} mode="create" selectedData={selectedRenter} onClose={() => setShowBookingForm(false)} onSuccess={fetchRenter} />
      {openDelete && <DeleteModal open={openDelete} onClose={() => setOpenDelete(false)} onClick={() => handleDelete(selectedRenter!.id)} />}
    </div>
  );
};

export default RenterProfile;