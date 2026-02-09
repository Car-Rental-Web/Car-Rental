/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo, useCallback } from "react";
import type {
  DataBookingRow,
  DataVehicleTypes,
  VehicleFormValues,
} from "../types/types";
import { supabase } from "../utils/supabase";
import icons from "../constants/icon";
import { CustomButtons } from "../components/CustomButtons";
import { useModalStore } from "../store/useModalStore";
import VehicleHistoryForm from "../modals/VehicleHistoryForm";
import { toast } from "react-toastify";
import { DeleteModal } from "../modals";
import { VehicleRenterForm } from "../components";
import { usePagination } from "../utils/Pagination";
import { formatDate } from "../utils/timeFormatter";

const getRegistrationStatus = (lastDate: string | null) => {
  if (!lastDate) return { text: "Unregistered", color: "bg-gray-400", valid: false };

  const today = new Date();
  const regDate = new Date(lastDate);
  const expiryDate = new Date(regDate);
  expiryDate.setFullYear(regDate.getFullYear() + 1);

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  if (today > expiryDate) {
    return { text: "Expired", color: "bg-red-600", valid: false };
  } else if (expiryDate <= thirtyDaysFromNow) {
    return { text: "Expiring Soon", color: "bg-yellow-500", valid: true };
  } else {
    return { text: "Registered", color: "bg-green-500", valid: true };
  }
};

const VehicleHistory = () => {
  const [selectDate, setSelectDate] = useState<DataBookingRow[]>([]);
  const [openSchedule, setOpenSchedule] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<DataVehicleTypes | null>(null);
  const [vehicleCard, setVehicleCard] = useState<DataVehicleTypes[]>([]);
  const [isClicked, setIsClicked] = useState<number | null>(null);
  const [openAction, setopenAction] = useState<number | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectVehicleId, setSelectVehicleId] = useState<VehicleFormValues | null>(null);
  const [historyData, setHistoryData] = useState<DataBookingRow[]>([]);
  const [selectedHistoryVehicle, setSelectedHistoryVehicle] = useState<DataVehicleTypes | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit" | "view">("create");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [regStatusFilter, setRegStatusFilter] = useState("All");

  const [openRenewalModal, setOpenRenewalModal] = useState(false);
  const [vehicleToRenew, setVehicleToRenew] = useState<DataVehicleTypes | null>(null);
  const [newRenewalDate, setNewRenewalDate] = useState(new Date().toISOString().split('T')[0]);

  const { open, onOpen, onClose } = useModalStore();

  // 1. Filter Logic
  const filteredVehicles = vehicleCard.filter((vehicle) => {
    const matchesSearch =
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.plate_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "All" || vehicle.type === selectedType;
    const matchesStatus = selectedStatus === "All" || vehicle.status === selectedStatus;
    
    const regStatus = getRegistrationStatus(vehicle.last_registration_date);
    const matchesReg = regStatusFilter === "All" || regStatus.text === regStatusFilter;

    return matchesSearch && matchesType && matchesStatus && matchesReg;
  });

  const groupedVehicles = useMemo(() => {
    return filteredVehicles.reduce((groups, vehicle) => {
      const type = vehicle.type || "Uncategorized";
      if (!groups[type]) groups[type] = [];
      groups[type].push(vehicle);
      return groups;
    }, {} as Record<string, DataVehicleTypes[]>);
  }, [filteredVehicles]);

  const vehicleTypes = Object.keys(groupedVehicles).sort();

  const {
    currentPage,
    itemsPerPage,
    setItemsPerPage,
    setCurrentPage,
    currentItems,
    totalPages,
    indexOfFirstItem,
    indexOfLastItem,
  } = usePagination(historyData, 5);

  const fetchVehicle = useCallback(async () => {
    try {
      const { data } = await supabase.from("vehicle").select("*").is("deleted_at", null);
      setVehicleCard(data || []);
    } catch (error) {
      console.log("Failed Fetching Vehicle", error);
    }
  }, []);

  // Automatic Updating Logic
  useEffect(() => {
    const autoUpdateExpiredVehicles = async () => {
      const vehiclesToUpdate = vehicleCard.filter(v => 
        v.last_registration_date && 
        getRegistrationStatus(v.last_registration_date).text === "Expired" &&
        v.status !== "Expired"
      );

      if (vehiclesToUpdate.length === 0) return;
      
      const promises = vehiclesToUpdate.map(vehicle => 
        supabase
          .from("vehicle")
          .update({ status: "Expired" })
          .eq("id", vehicle.id)
      );

      await Promise.all(promises);
      fetchVehicle();
    };

    if (vehicleCard.length > 0) {
      autoUpdateExpiredVehicles();
    }
  }, [vehicleCard, fetchVehicle]);

  const handleConfirmRenewal = async () => {
    if (!vehicleToRenew) return;

    const { error } = await supabase
      .from("vehicle")
      .update({ 
        last_registration_date: newRenewalDate,
        status: "Available"
      })
      .eq("id", vehicleToRenew.id);

    if (error) {
      toast.error("Failed to update registration");
      return;
    }
    toast.success("Registration renewed!");
    setOpenRenewalModal(false);
    setVehicleToRenew(null);
    fetchVehicle();
  };

  const fetchHistory = async (vehicle: DataVehicleTypes) => {
    const { data, error } = await supabase
      .from("renter_booking")
      .select("*")
      .eq("car_plate_number", vehicle.plate_number)
      .order("created_at", { ascending: false });

    if (error) return console.log("Error Fetching history");
    setHistoryData(data || []);
    setSelectedHistoryVehicle(vehicle);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  const fetchBookingDate = useCallback(async () => {
    const { data, error } = await supabase.from("renter_booking").select("*").in("status", ["On Service", "On Reservation"]).is("deleted_at", null);
    if (error) return;
    setSelectDate(data || []);
  }, []);

  // UPDATED DELETE LOGIC FOR STORAGE CLEANUP
  const handleDelete = async (id: number) => {
    try {
      // 1. Get vehicle data to find image URL
      const { data: vehicleToDelete, error: fetchError } = await supabase
        .from("vehicle")
        .select("car_image")
        .eq("id", id)
        .single();
        
      if (fetchError) throw fetchError;

      // 2. Perform Soft Delete (move to trash)
      const { error: deleteError } = await supabase
        .from("vehicle")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
        
      if (deleteError) throw deleteError;

      // 3. Remove image from storage
      if (vehicleToDelete?.car_image) {
        const fileUrl = vehicleToDelete.car_image;
        const filePath = fileUrl.split("/").pop(); // Assumes URL structure allows this
        
        if (filePath) {
          await supabase.storage.from("vehicle_image").remove([filePath]);
        }
      }

      toast.success("Moved to Trash Successfully");
      setOpenDelete(false);
      setopenAction(null);
      fetchVehicle();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to Move to Trash");
    }
  };

  useEffect(() => {
    fetchVehicle();
    fetchBookingDate();
  }, [open, openDelete, onClose, fetchVehicle, fetchBookingDate]);

  return (
    <div className="overflow-y-auto h-full bg-gray-50/50 p-4 md:p-8">
      {/* ... Filter Section ... */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <icons.search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search model, brand, or plate number..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-1">
          <icons.calendar className="text-gray-400" />
          <select
            className="bg-transparent py-2 outline-none text-sm font-medium text-gray-700"
            value={regStatusFilter}
            onChange={(e) => setRegStatusFilter(e.target.value)}
          >
            <option value="All">All Reg Status</option>
            <option value="Registered">Registered</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
            <option value="Unregistered">Unregistered</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-1">
          <icons.filter className="text-gray-400" />
          <select
            className="bg-transparent py-2 outline-none text-sm font-medium text-gray-700"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Sedan">Sedan</option>
            <option value="MPV">MPV</option>
            <option value="SUV">SUV</option>
            <option value="VAN">Van</option>
            <option value="PICK UP">Pickup</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-1">
          <icons.filter className="text-gray-400" />
          <select
            className="bg-transparent py-2 outline-none text-sm font-medium text-gray-700"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="All">Status</option>
            <option value="Available">Available</option>
            <option value="On Service">On Service</option>
            <option value="Rented">Rented</option>
            <option value="On Reservation">On Reservation</option>
            <option value="On Maintenance">On Maintenance</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>
      
      {/* ... Header Actions ... */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Fleet</h1>
          <p className="text-gray-500 text-sm">Manage your vehicles and track rental history.</p>
        </div>
        <CustomButtons
          icons={<icons.add className="text-lg" />}
          handleclick={() => {
            setFormMode("create");
            setSelectVehicleId(null);
            onOpen();
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-lg transition-all"
        >
          <span>Add New Vehicle</span>
        </CustomButtons>
      </div>

      <VehicleHistoryForm mode={formMode} open={open} onClose={onClose} initialData={selectVehicleId ?? undefined} />

      {/* Grouped Vehicle Cards */}
      <div className="space-y-12">
        {vehicleTypes.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <icons.car className="text-4xl text-gray-300 mb-4" />
            <p className="text-gray-400 font-medium">No vehicles found in the fleet</p>
          </div>
        ) : (
          vehicleTypes.map((type) => (
            <div key={type} className="space-y-6">
              {/* Category Header */}
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
                  {type}s
                </h2>
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-xs font-bold text-gray-400">
                  {groupedVehicles[type].length} Total Units
                </span>
              </div>

              {/* Grid for this Category */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {groupedVehicles[type].map((vehicle) => {
                  const regStatus = getRegistrationStatus(vehicle.last_registration_date);
                  return (
                  <div
                    key={vehicle.id}
                    className={`group bg-white border rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 relative ${
                      vehicle.status === "On Service" ? "border-red-500" : 
                      vehicle.status === "On Reservation" ? "border-blue-500" : 
                      vehicle.status === "Available" ? "border-green-500" : 
                      vehicle.status === "On Maintenance" ? "border-red-500" : 
                      vehicle.status === "Expired" ? "border-red-600" : "border-gray-100"
                    }`}
                  >
                    {/* Status Badge */}
                    <div className={`absolute top-5 left-5 z-10 ${vehicle.status === "On Service" ? "animate-pulse" : ""} `}>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        vehicle.status === "On Service" || vehicle.status === "On Maintenance" ? "bg-red-500 text-white border-red-600" :
                        vehicle.status === "On Reservation" ? "bg-blue-50 text-blue-600 border-blue-100" :
                        vehicle.status === "Available" ? "bg-green-500 text-white border-green-600" : 
                        vehicle.status === "Expired" ? "bg-red-700 text-white border-red-800" : "bg-gray-50 text-gray-600"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${vehicle.status === "On Reservation" ? "bg-blue-500" : "bg-white"}`} />
                        {vehicle.status}
                      </div>
                    </div>

                    {/* Reg Status Badge */}
                    <div className={`absolute top-5 right-5 z-10 ${regStatus.color} text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
                      {regStatus.text}
                    </div>

                    {/* Action Menu */}
                    <div className="absolute top-16 right-4 z-20">
                      <button
                        onClick={() => setopenAction(openAction === vehicle.id ? null : vehicle.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <icons.action className="text-gray-400 text-xl" />
                      </button>
                      {openAction === vehicle.id && (
                        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 shadow-2xl rounded-xl overflow-hidden z-50">
                          <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors" onClick={() => { setFormMode("view"); setSelectVehicleId(vehicle); onOpen(); }}>
                            <icons.openEye className="text-emerald-500" /> View Details
                          </button>
                          <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 border-t border-gray-50 transition-colors" onClick={() => { setFormMode("edit"); setSelectVehicleId(vehicle); onOpen(); }}>
                            <icons.edit className="text-blue-500" /> Edit Info
                          </button>
                          <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 border-t border-gray-50 transition-colors" onClick={() => { setSelectVehicleId(vehicle); setOpenDelete(true); }}>
                            <icons.trash /> Delete Vehicle
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Schedule Dropdown */}
                    {(vehicle.status === "On Service" || vehicle.status === "On Reservation") && (
                       <div className="absolute top-16 right-14">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenSchedule(openSchedule === vehicle.id ? null : vehicle.id); }}
                          className="flex items-center gap-1 text-[9px] font-bold text-gray-500 hover:text-blue-600 bg-white border border-gray-100 px-2 py-1 rounded shadow-sm"
                        >
                          <icons.calendar className="text-[10px]" />
                          {openSchedule === vehicle.id ? "Close" : "Schedule"}
                        </button>
                        {openSchedule === vehicle.id && (
                          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 shadow-2xl rounded-xl p-3 z-50">
                             <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 border-b border-gray-50 pb-1">Booking Dates</h4>
                             <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                                {selectDate.filter((d) => d.car_plate_number === vehicle.plate_number).map((date) => (
                                  <div key={date.id} className="p-2 bg-gray-50 rounded-lg border border-gray-100 text-[10px]">
                                    <p className="font-bold text-gray-800">{date.full_name}</p>
                                    <p className="text-gray-600"><span className="font-extrabold">Start:</span> {formatDate(date.start_date)}</p>
                                    <p className="text-gray-600"><span className="font-extrabold">End:</span> {formatDate(date.end_date)}</p>
                                    <p className="text-gray-600"><span className="font-extrabold">Duration</span> {date.duration} Day/s</p>
                                    <p className="text-gray-600"><span className="font-extrabold">Remarks:</span> {date.remarks} </p>
                                    <p className="text-gray-600"><span className="font-extrabold">Status:</span> {date.status} </p>
                                  </div>
                                ))}
                             </div>
                          </div>
                        )}
                       </div>
                    )}

                    {/* Card Content */}
                    <div className="flex gap-5 mt-8">
                      <div className="w-32 h-32 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                        <img src={vehicle.car_image} alt="car" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex flex-col justify-between py-1 w-full">
                        <div>
                          <h3 className="font-bold text-gray-900 leading-tight">{vehicle.brand} {vehicle.model}</h3>
                          <p className="text-gray-500 text-xs mt-1 uppercase tracking-wider">{vehicle.type} • {vehicle.color}</p>
                          <span className="inline-block mt-2 px-2 py-1 bg-gray-900 text-white text-[10px] font-mono font-bold rounded">
                            {vehicle.plate_number}
                          </span>
                          <p className="text-gray-800 text-[10px] mt-1 ">Registered Date:  {vehicle.last_registration_date ? formatDate(vehicle.last_registration_date) : "Never"}</p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          {!regStatus.valid && (
                            <button onClick={() => { setVehicleToRenew(vehicle); setOpenRenewalModal(true); }}
                                className="cursor-pointer flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-semibold transition-all hover:bg-red-200">
                                <icons.calendar /> Renew
                            </button>
                          )}
                          <button onClick={() => { fetchHistory(vehicle); setIsClicked(vehicle.id); }}
                            className={`cursor-pointer flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${isClicked === vehicle.id ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
                            History <icons.rightArrow />
                          </button>
                          <button onClick={() => { setShowForm(true); setSelectedVehicle(vehicle); }}
                            className={`cursor-pointer flex-1 flex items-center justify-center gap-2 px-3 py-2 text-white rounded-lg text-[10px] font-semibold transition-all ${vehicle.status === "On Service" || vehicle.status === "On Maintenance" || vehicle.status === "Expired" ? "bg-red-500" : vehicle.status === "On Reservation" ? "bg-blue-500" : "bg-gray-900 hover:bg-black"}`}>
                            {vehicle.status === "Available" ? "Rent" : vehicle.status} <icons.rightArrow />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- RENEWAL MODAL UI --- */}
      {openRenewalModal && vehicleToRenew && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Renew Registration</h3>
            <p className="text-sm text-gray-500 mb-4">
              Select a new registration date for <strong>{vehicleToRenew.brand} {vehicleToRenew.model} ({vehicleToRenew.plate_number})</strong>.
            </p>
            <label className="block text-xs font-semibold text-gray-700 mb-1">New Registration Date</label>
            <input 
              type="date" 
              value={newRenewalDate}
              onChange={(e) => setNewRenewalDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 mb-6"
            />
            <div className="flex gap-3">
              <button onClick={() => setOpenRenewalModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={handleConfirmRenewal} className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ... History Table and Modals ... */}
      {selectedHistoryVehicle && (
        <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 bg-white border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Rental History</h2>
                <p className="text-gray-500 text-sm mt-1">Tracking logs for <span className="text-blue-600 font-bold">{selectedHistoryVehicle.plate_number}</span></p>
              </div>
              <button onClick={() => { setSelectedHistoryVehicle(null); setIsClicked(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">Close History</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date Created</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Renter</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Period</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentItems.length > 0 ? (
                    currentItems.map((row) => (
                      <tr key={row.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-8 py-4"><p className="text-sm font-semibold text-gray-700">{formatDate(row.created_at.split("T")[0])}</p></td>
                        <td className="px-6 py-4 text-center"><p className="text-sm font-bold text-gray-900">{row.full_name}</p></td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-xs space-y-0.5">
                            <span className="text-gray-700 font-medium">Start: {formatDate(row.start_date)}</span>
                            <span className="text-gray-400 px-1">|</span>
                            <span className="text-gray-400 italic">End: {formatDate(row.end_date)}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${row.status === "Completed" ? "bg-red-500 text-red-100" : row.status === "On Service" ? "bg-emerald-500 text-emerald-100" : "bg-blue-500 text-blue-100"}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="px-8 py-16 text-center text-gray-400 italic">No rental history found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <p className="text-xs text-gray-500">Rows:
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="ml-2 bg-transparent font-bold text-gray-900 outline-none"
                  >
                    {[5, 10, 20].map((val) => (<option key={val} value={val}>{val}</option>))}
                  </select>
                </p>
                <div className="h-4 w-px bg-gray-300"></div>
                <p className="text-xs text-gray-500 font-medium">
                  Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, historyData.length)} of {historyData.length}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-black disabled:opacity-60 hover:bg-gray-50"
                >
                  <icons.leftPagination className="text-sm" />
                </button>
                <span className="text-xs font-bold text-gray-900 px-2">Page {currentPage} of {totalPages || 1}</span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-black  disabled:opacity-60 hover:bg-gray-50"
                >
                  <icons.rightPagination className="text-sm" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <DeleteModal onClose={() => setOpenDelete(false)} onClick={() => selectVehicleId && handleDelete(selectVehicleId.id)} open={openDelete} />
      {showForm && (
        <VehicleRenterForm
          selectedData={selectedVehicle || null}
          open={showForm}
          onClose={() => { setShowForm(false); setSelectedVehicle(null); fetchVehicle(); fetchBookingDate(); }}
        />
      )}
    </div>
  );
};

export default VehicleHistory;