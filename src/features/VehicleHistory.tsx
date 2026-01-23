import { useEffect, useState } from "react";
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

const VehicleHistory = () => {
  const [selectDate, setSelectDate] = useState<DataBookingRow[]>([]);
  const [openSchedule, setOpenSchedule] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] =
    useState<DataVehicleTypes | null>(null);
  const [vehicleCard, setVehicleCard] = useState<DataVehicleTypes[]>([]);
  const [isClicked, setIsClicked] = useState<number | null>(null);
  const [openAction, setopenAction] = useState<number | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectVehicleId, setSelectVehicleId] =
    useState<VehicleFormValues | null>(null);
  const [historyData, setHistoryData] = useState<DataBookingRow[]>([]);
  const [selectedHistoryVehicle, setSelectedHistoryVehicle] =
    useState<DataVehicleTypes | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit" | "view">(
    "create",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const filteredVehicles = vehicleCard.filter((vehicle) => {
    // 1. Search Filter (Brand, Model, Plate)
    const matchesSearch =
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.plate_number.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Type Filter (Sedan, SUV, etc.)
    const matchesType = selectedType === "All" || vehicle.type === selectedType;

    // 3. Status Filter (Available, On Service, etc.)
    const matchesStatus =
      selectedStatus === "All" || vehicle.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });
  const { open, onOpen, onClose } = useModalStore();
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

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("vehicle").delete().eq("id", id);
    if (error) {
      toast.error("Failed to Delete");
      return;
    }
    toast.success("Successfully Deleted");
    setOpenDelete(false);
    setopenAction(null);
    fetchVehicle();
  };

  const fetchVehicle = async () => {
    try {
      const { data } = await supabase.from("vehicle").select("*");
      setVehicleCard(data || []);444444444
      console.log('Fetched Vehicle', data)
    } catch (error) {
      console.log("Failed Fetching Vehicle", error);
    }
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

  const fetchBookingDate = async () => {
    const { data, error } = await supabase.from("renter_booking").select("*");

    if (error) {
      console.log("Failed to fetch");
      return;
    }
    console.log("Fetch Date", data);
    setSelectDate(data);
  };

  useEffect(() => {
    fetchVehicle();
    fetchBookingDate();
  }, [open, openDelete, onClose]);

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      {/* Header Section */}

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
          <icons.filter className="text-gray-400" />
          <select
            className="bg-transparent py-2 outline-none text-sm font-medium text-gray-700"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Sedan">Sedan</option>
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
            <option value="On Reservation">On Reservation</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Fleet</h1>
          <p className="text-gray-500 text-sm">
            Manage your vehicles and track rental history.
          </p>
        </div>
        <CustomButtons
          icons={<icons.add className="text-lg" />}
          handleclick={() => {
            setFormMode("create");
            setSelectVehicleId(null);
            onOpen();
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
        >
          <span>Add New Vehicle</span>
        </CustomButtons>
      </div>

      <VehicleHistoryForm
        mode={formMode}
        open={open}
        onClose={onClose}
        initialData={selectVehicleId ?? undefined}
      />

      {/* Vehicle Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredVehicles.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <div className="p-4 bg-gray-50 rounded-full mb-4">
              <icons.car className="text-4xl text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium">
              No vehicles available in the fleet
            </p>
          </div>
        ) : (
          filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className={`group bg-white border  rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 relative ${vehicle.status === "On Service" ? "border-red-500" : vehicle.status === "On Reservation" ? "border-blue-500" : vehicle.status === "Completed" ? "border-gray-100" : vehicle.status === "Available" ? "border-green-500" : "border-none"} `}
            >
              {/* status */}
              <div className="absolute top-5 left-5">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    vehicle.status === "On Service"
                      ? "bg-red-50 text-red-600 border-red-100"
                      : vehicle.status === "On Reservation"
                        ? "bg-blue-50 text-blue-600 border-blue-100"
                        : vehicle.status === "Completed"
                          ? "bg-gray-50 text-gray-600 border-gray-100"
                          : "bg-green-50 text-green-600 border-green-100" // Available
                  }`}
                >
                  {/* Small Status Dot */}
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      vehicle.status === "On Service"
                        ? "bg-red-500"
                        : vehicle.status === "On Reservation"
                          ? "bg-blue-500"
                          : vehicle.status === "Completed"
                            ? "bg-gray-400"
                            : "bg-green-500"
                    }`}
                  />
                  {vehicle.status}
                </div>
              </div>
              {(vehicle.status === "On Service" ||
                vehicle.status === "On Reservation") && (
                  <div className="absolute top-5 right-15">
<div className="relative group  ">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenSchedule(
                        openSchedule === vehicle.id ? null : vehicle.id,
                      );
                    }}
                    className="flex items-center gap-1 text-[9px] font-bold text-gray-500 hover:text-blue-600 bg-white border border-gray-100 px-2 py-1 rounded shadow-sm transition-colors"
                  >
                    <icons.calendar className="text-[10px]" />
                    {openSchedule === vehicle.id
                      ? "Close Schedule"
                      : "View Schedule"}
                  </button>

                  {/* The "Better" Popover: Hidden by default, shows on hover or click */}
                  {openSchedule === vehicle.id && (
                    <>
                      {/* Invisible backdrop to close when clicking outside */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOpenSchedule(null)}
                      />

                      <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-100 shadow-2xl rounded-xl p-3 z-50 animate-in fade-in zoom-in duration-200">
                        <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 border-b border-gray-50 pb-1">
                          Booking Dates
                        </h4>
                        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                          {selectDate
                            .filter(
                              (date) =>
                                date.car_plate_number === vehicle.plate_number,
                            )
                            .map((date) => (
                              <div
                                key={date.id}
                                className="flex flex-col gap-0.5 p-2 bg-gray-50 rounded-lg border border-gray-100"
                              >
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-gray-400">Start</span>
                                  <span className="font-bold text-gray-700">
                                    {formatDate(date.start_date)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-gray-400">End</span>
                                  <span className="font-bold text-gray-700">
                                    {formatDate(date.end_date)}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                  </div>
                
              )}
              {/* Action Dropdown */}
              <div className="absolute top-4 right-4 z-10">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() =>
                      setopenAction(
                        openAction === vehicle.id ? null : vehicle.id,
                      )
                    }
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <icons.action className="text-gray-400 text-xl" />
                  </button>
                </div>

                {openAction === vehicle.id && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 shadow-2xl rounded-xl overflow-hidden z-50">
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setFormMode("view");
                        setSelectVehicleId(vehicle);
                        onOpen();
                      }}
                    >
                      <icons.openEye className="text-emerald-500" /> View
                      Details
                    </button>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 border-t border-gray-50 transition-colors"
                      onClick={() => {
                        setFormMode("edit");
                        setSelectVehicleId(vehicle);
                        onOpen();
                      }}
                    >
                      <icons.edit className="text-blue-500" /> Edit Info
                    </button>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 border-t border-gray-50 transition-colors"
                      onClick={() => setOpenDelete(true)}
                    >
                      <icons.trash /> Delete Vehicle
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-5">
                {/* Vehicle Image */}
                <div className="w-32 h-32 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                  <img
                    src={vehicle.car_image}
                    alt="car"
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Vehicle Info */}
                <div className="flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    <p className="text-gray-500 text-xs mt-1 uppercase tracking-wider">
                      {vehicle.type} • {vehicle.color}
                    </p>
                    <span className="inline-block mt-2 px-2 py-1 bg-gray-900 text-white text-[10px] font-mono font-bold rounded">
                      {vehicle.plate_number}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        fetchHistory(vehicle);
                        setIsClicked(vehicle.id);
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isClicked === vehicle.id
                          ? "bg-blue-50 text-blue-600 border border-blue-200"
                          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      History <icons.rightArrow />
                    </button>
                    <button
                      disabled={vehicle.status === "On Service"}
                      onClick={() => {
                        setShowForm(true);
                        setSelectedVehicle(vehicle);
                      }}
                      className={`flex-1  flex items-center justify-center gap-2 px-3 py-2  text-white rounded-lg text-xs font-semibold transition-all cursor-pointer ${vehicle.status === "On Service" ? "bg-red-500" : vehicle.status === "On Reservation" ? "bg-blue-500" : "bg-gray-900 hover:bg-black"}`}
                    >
                      {vehicle.status === "On Service"
                        ? "Rented"
                        : vehicle.status === "On Reservation"
                          ? "Reserved"
                          : "Rent"}{" "}
                      <icons.rightArrow />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* History Table Section */}
      {selectedHistoryVehicle && (
        <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 bg-white border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Rental History
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Tracking logs for{" "}
                  <span className="text-blue-600 font-bold">
                    {selectedHistoryVehicle.brand}{" "}
                    {selectedHistoryVehicle.model}
                  </span>
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedHistoryVehicle(null);
                  setIsClicked(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
              >
                Close History
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Date Created
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Renter
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                      License
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Period
                    </th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentItems.length > 0 ? (
                    currentItems.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-blue-50/30 transition-colors group"
                      >
                        <td className="px-8 py-4">
                          <p className="text-sm font-semibold text-gray-700">
                            {row.created_at.split("T")[0]}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-gray-900">
                            {row.full_name}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-500 font-mono">
                            {row.license_number}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs space-y-0.5">
                            <p className="text-gray-700 font-medium">
                              Start: {formatDate(row.start_date)}
                            </p>
                            <p className="text-gray-400 italic">
                              End: {formatDate(row.end_date)}
                            </p>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                              row.status === "Completed"
                                ? "bg-red-500 text-red-100"
                                : row.status === "On Service"
                                  ? "bg-emerald-500 text-emerald-100"
                                  : row.status === "On Reservation"
                                    ? "bg-blue-500 text-blue-100"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-8 py-16 text-center text-gray-400 italic"
                      >
                        No rental history found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <p className="text-xs text-gray-500">
                  Rows:
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="ml-2 bg-transparent font-bold text-gray-900 outline-none"
                  >
                    {[5, 10, 20].map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                </p>
                <div className="h-4 w-px bg-gray-300"></div>
                <p className="text-xs text-gray-500 font-medium">
                  Showing {indexOfFirstItem + 1}-
                  {Math.min(indexOfLastItem, historyData.length)} of{" "}
                  {historyData.length}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-30 hover:bg-gray-50 cursor-pointer"
                >
                  <icons.leftArrow className="text-sm" />
                </button>
                <span className="text-xs font-bold text-gray-900 px-2">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-30 hover:bg-gray-50 cursor-pointer"
                >
                  <icons.rightArrow className="text-sm" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forms & Modals */}
      <DeleteModal
        onClose={() => setOpenDelete(false)}
        onClick={() => selectVehicleId && handleDelete(selectVehicleId.id)}
        open={openDelete}
      />
      {showForm && (
        <VehicleRenterForm
          selectedData={selectedVehicle}
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedVehicle(null);
          }}
        />
      )}
    </div>
  );
};

export default VehicleHistory;
