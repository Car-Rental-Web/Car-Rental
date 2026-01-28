import { useEffect, useState, useCallback } from "react";
import type { DataRenterHistoryProps } from "../types/types";
import { supabase } from "../utils/supabase";
import { SearchBar } from "../components";
import icons from "../constants/icon";
import { useDebouncedValue } from "../utils/useDebounce";
import { toast } from "react-toastify";
import { DeleteModal } from "../modals";
import RenterForm from "../components/RenterForm";
import ProfileForm from "../components/ProfileForm";
import { usePagination } from "../utils/Pagination";
import Card from "../components/Card";
import { formatDate } from "../utils/timeFormatter";
import { filterData } from "../utils/FilterData";

const RenterProfile = () => {
  const [renterData, setRenterData] = useState<DataRenterHistoryProps[]>([]);
  const [filterRenterData, setFilterRenterData] = useState<DataRenterHistoryProps[]>([]);
  const [renterHistory, setRenterHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal Control States
  const [showRegForm, setShowRegForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "view" | "edit">("view");
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedRenter, setSelectedRenter] = useState<DataRenterHistoryProps | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [selectedLicense, setSelectedLicense] = useState("");

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

  const historyPagination = usePagination(renterHistory, 5);
  const debounceSearchTerm = useDebouncedValue(searchTerm, 200);

  // Fetch Logic
  const fetchRenter = useCallback(async () => {
    const { data, error } = await supabase
      .from("renter")
      .select("*")
      .order("created_at", { ascending: false })
      .is("deleted_at", null);
    if (error) return;
    setRenterData(data || []);
    setFilterRenterData(data || []);
  }, []);

  useEffect(() => {
    fetchRenter();
    const subscription = supabase
      .channel("renter-db")
      .on("postgres_changes", { event: "*", schema: "public", table: "renter" }, () => fetchRenter())
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
    ]);
    setRenterData(result);
    setCurrentPage(1);
  }, [debounceSearchTerm, filterRenterData, setCurrentPage]);

  // History Logic
  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedName || !selectedLicense) return;
      const { data } = await supabase
        .from("renter_booking")
        .select("*")
        .eq("full_name", selectedName)
        .eq("license_number", selectedLicense)
        .order("created_at", { ascending: false });
      setRenterHistory(data || []);
      historyPagination.setCurrentPage(1);
    };
    fetchHistory();
  }, [selectedName, selectedLicense]);

  const handleDelete = async (id: number) => {
    try {
      const { data: renter, error: fetchError } = await supabase
        .from("renter")
        .select("valid_id, e_signature, renter_selfie") // Included renter_selfie
        .eq("id", id)
        .single();

      if (fetchError) throw new Error("Could not find renter data");

      // Helper to extract filename from URL
      const getFileName = (url: string) => url?.split("/").pop();

      // Delete from Storage Buckets
      if (renter.valid_id) {
        await supabase.storage.from("valid_id").remove([getFileName(renter.valid_id)!]);
      }
      if (renter.e_signature) {
        await supabase.storage.from("e_signature").remove([getFileName(renter.e_signature)!]);
      }
      // NEW: Delete Selfie from storage
      if (renter.renter_selfie) {
        await supabase.storage.from("renter_selfie").remove([getFileName(renter.renter_selfie)!]);
      }

      // Soft delete from Database
      const { error: deleteError } = await supabase
        .from("renter")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (deleteError) throw deleteError;

      toast.success("Moved to Trash Successfully");
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
          title={<span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Renters</span>}
          url={""}
          amount={<span className="text-5xl font-bold text-slate-800">{filterRenterData.length}</span>}
          description="Total registered in database"
          topIcon={<p className="p-3 bg-blue-50 rounded-xl"><icons.person className="text-blue-600 text-2xl" /></p>}
        />
        <Card
          className="bg-white border border-slate-200 shadow-sm w-full transition-transform hover:scale-[1.01]"
          title={<span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Records</span>}
          url={""}
          amount={<span className="text-5xl font-bold text-emerald-500">{renterData.length}</span>}
          description="Renter entries found"
          topIcon={<p className="p-3 bg-emerald-50 rounded-xl"><icons.rent className="text-emerald-600 text-2xl" /></p>}
        />
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-slate-700">Renter Database</h2>
          <button
            onClick={() => { setFormMode("create"); setSelectedRenter(null); setShowRegForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-md"
          >
            <icons.add size={16} /> New Registration
          </button>
        </div>
        <div className="w-full sm:w-72">
          <SearchBar
            onClear={() => setSearchTerm("")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2.5 px-4 border border-slate-200 bg-slate-50 text-slate-700 rounded-lg outline-none"
            placeholder="Search Renter Details..."
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-left min-w-[1400px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="w-16 p-4 text-[11px] font-bold text-slate-500 uppercase text-center">ID</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">Created</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">Renter Name</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">Address</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">Contact #</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">Facebook</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">License #</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">Tin No.</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">Philhealth No.</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">SSS No.</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">Pagibig No.</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">Selfie</th> 
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">Valid ID</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">Signature</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">Referral</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">Add Rent</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.map((row, index) => (
                <tr
                  key={row.id}
                  onClick={() => { setSelectedName(row.full_name); setSelectedLicense(row.license_number); }}
                  className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                >
                  <td className="p-4 text-center text-xs font-semibold text-slate-400">{indexOfFirstItem + index + 1}</td>
                  <td className="p-4 text-center text-xs text-slate-600">{row.created_at.split("T")[0]}</td>
                  <td className="p-4 text-center text-xs font-bold text-slate-800">{row.full_name || "N/A"}</td>
                  <td className="p-4 text-center text-xs text-slate-600 truncate max-w-[150px]">{row.address || "N/A"}</td>
                  <td className="p-4 text-center text-xs font-mono text-slate-500">{row.contact_number || "N/A"}</td>
                  <td className="p-4 text-center text-xs font-mono text-slate-500">{row.facebook_account || "N/A"}</td>
                  <td className="p-4 text-center text-xs font-mono text-slate-500">{row.license_number || "N/A"}</td>
                  <td className="p-4 text-center text-xs font-mono text-slate-500">{row.tin_number || "N/A"}</td>
                  <td className="p-4 text-center text-xs font-mono text-slate-500">{row.philhealth_number || "N/A"}</td>
                  <td className="p-4 text-center text-xs font-mono text-slate-500">{row.sss_number || "N/A"}</td>
                  <td className="p-4 text-center text-xs font-mono text-slate-500">{row.pagibig_number || "N/A"}</td>
                  
                  {/* NEW: Renter Selfie TD */}
                  <td className="p-4 text-center">
                    <img
                      className="w-10 h-10 object-cover rounded-full mx-auto border-2 border-slate-200"
                      src={row.renter_selfie}
                      alt="Selfie"
                      onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/40")}
                    />
                  </td>
                  <td className="p-4 text-center">
                    <img className="w-10 h-10 object-cover rounded-lg mx-auto" src={row.valid_id} alt="ID" />
                  </td>
                  <td className="p-4 text-center">
                    <img className="w-10 h-10 object-contain bg-slate-50 rounded-lg mx-auto" src={row.e_signature} alt="Sign" />
                  </td>
                  <td className="p-4 text-center text-xs font-mono text-slate-500">{row.referral || "N/A"}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedRenter(row); setShowBookingForm(true); }}
                      className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-full cursor-pointer"
                    >
                      <icons.rent size={18} />
                    </button>
                  </td>
                  <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => { setSelectedRenter(row); setFormMode("view"); setShowRegForm(true); }} className="p-2 bg-white border border-slate-200 rounded-lg text-emerald-600"><icons.openEye /></button>
                      <button onClick={() => { setSelectedRenter(row); setFormMode("edit"); setShowRegForm(true); }} className="p-2 bg-white border border-slate-200 rounded-lg text-blue-600"><icons.edit /></button>
                      <button onClick={() => { setSelectedRenter(row); setOpenDelete(true); }} className="p-2 bg-white border border-slate-200 rounded-lg text-red-500"><icons.trash /></button>
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
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold"
          >
            {[5, 10, 20].map((val) => (<option key={val} value={val}>{val}</option>))}
          </select>
          <p className="text-xs font-semibold text-slate-500">
            Showing {renterData.length === 0 ? 0 : indexOfFirstItem + 1}-{Math.min(indexOfLastItem, renterData.length)} of {renterData.length}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-4 py-2 text-xs font-bold bg-white border rounded-xl disabled:opacity-40">Prev</button>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">{currentPage} / {totalPages || 1}</span>
          <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="px-4 py-2 text-xs font-bold bg-white border rounded-xl disabled:opacity-40">Next</button>
        </div>
      </div>

      {/* History Detail View */}
      {selectedLicense && (
        <div className="mt-8 p-6 bg-white border border-slate-200 rounded-2xl shadow-xl animate-in slide-in-from-bottom-5">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-800">Rental Record</h2>
              <p className="text-sm text-blue-500 font-bold uppercase">{selectedName} — {selectedLicense}</p>
            </div>
            <button onClick={() => { setSelectedLicense(""); setSelectedName(""); }} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">Close View</button>
          </div>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-center table-fixed">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="p-4 text-[10px] uppercase">Rent Created</th>
                  <th className="p-4 text-[10px] uppercase">Car Rented</th>
                  <th className="p-4 text-[10px] uppercase">Schedule</th>
                  <th className="p-4 text-[10px] uppercase">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyPagination.currentItems.map((history) => (
                  <tr key={history.id}>
                    <td className="p-4 font-bold text-sm">{formatDate(history.created_at.split("T")[0])}</td>
                    <td className="p-4 font-bold text-sm">{history.car_plate_number}</td>
                    <td className="p-4 font-bold text-sm"><span>{formatDate(history.start_date)}</span> | <span>{formatDate(history.end_date)}</span></td>
                    <td className="p-4 font-bold text-sm">{history.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}
      <ProfileForm open={showRegForm} mode={formMode} selectedData={selectedRenter} onClose={() => setShowRegForm(false)} onSuccess={fetchRenter} />
      <RenterForm open={showBookingForm} mode="create" selectedData={selectedRenter} onClose={() => setShowBookingForm(false)} onSuccess={fetchRenter} />
      {openDelete && (
        <DeleteModal open={openDelete} onClose={() => setOpenDelete(false)} onClick={() => handleDelete(selectedRenter!.id)} />
      )}
    </div>
  );
};

export default RenterProfile;