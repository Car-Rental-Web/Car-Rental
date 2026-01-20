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

const VehicleHistory = () => {
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
    "create"
  );
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
    const { data, error } = await supabase
      .from("vehicle")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Failed to Delete");
      console.log("Error Deleting");
      return;
    }
    toast.success("Successfully Deleted");
    console.log("Successfully Deleted", data);
    setOpenDelete(false);
  };

  useEffect(() => {
    const fetchVehicle = async () => {
      // setLoading(true);
      try {
        const { data } = await supabase.from("vehicle").select("*");
        console.log("Fetched Vehicle", data);
        setVehicleCard(data || []);
      } catch (error) {
        console.log("Failed Fetching Vehicle", error);
      } finally {
        // setLoading(false);
      }
    };
    fetchVehicle();
  }, [open, openDelete]);

  const fetchHistory = async (vehicle: DataVehicleTypes) => {
    const { data, error } = await supabase
      .from("renter_booking")
      .select("*")
      .eq("car_plate_number", vehicle.plate_number)
      .order("created_at", { ascending: false });
    if (error) return console.log("Error Fetching history");
    console.log("Fetched History", data);
    setHistoryData(data || []);
    setSelectedHistoryVehicle(vehicle);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  return (
    <div className=" min-h-screen overflow-y-auto p-6">
      <div className="flex justify-end w-full pr-7 mb-3">
<CustomButtons
        handleclick={() => {
          setFormMode("create");
          setSelectVehicleId(null);
          onOpen();
        }}
        children="Add Vehicle"
        className="py-2 px-4 rounded bg-gray-800 hover:bg-gray-400 text-white hover:text-gray-800  cursor-pointer"
        icons={<icons.add className="text-white text-xl" />}
      />
      </div>
      
      <VehicleHistoryForm
        mode={formMode}
        open={open}
        onClose={onClose}
        initialData={selectVehicleId ?? undefined}
      />
      <div className="flex flex-wrap justify-center md:justify-start gap-2 w-full ">
        {vehicleCard.length === 0 ? (
          <p className="text-gray-400">No vehicles available</p>
        ) : (
          vehicleCard.map((vehicle) => (
            <div
              key={vehicle.id}
              className="flex flex-col border border-gray-400 hover:border-gray-800 rounded relative w-xl"
            >
              <div className="w-full">
                <div className="flex justify-between w-full pr-3 pl-1 pt-1">
                  <p>
                    {/* <icons.status className="text-green-500 animate-pulse" /> */}
                  </p>
                  <div className="flex gap-2 items-center justify-center">
                    <button
                      onClick={() =>
                        setopenAction((prev) =>
                          prev === vehicle.id ? null : vehicle.id
                        )
                      }
                      className="cursor-pointer"
                    >
                      <icons.action className="text-gray-200 text-xl" />
                    </button>
                    {openAction === vehicle.id && (
                      <div className="absolute right-0 top-7 bg-gray-800 border border-gray-500 flex flex-col z-50 rounded">
                        <button
                          className="hover:bg-gray-600 w-full text-start flex items-center gap-2 cursor-pointer border-b border-gray-400 py-2 px-4 text-gray-200"
                          onClick={() => {
                            setFormMode("view");
                            setSelectVehicleId(vehicle);
                            onOpen();
                          }}
                        >
                          <icons.openEye className="text-green-500" />
                          View
                        </button>
                        <button
                          className="hover:bg-gray-600 w-full text-start flex items-center gap-2 cursor-pointer border-b border-gray-400 py-2 px-4 text-gray-200"
                          onClick={() => {
                            setFormMode("edit");
                            setSelectVehicleId(vehicle);
                            onOpen();
                          }}
                        >
                          <icons.edit className="text-blue-500" />
                          Edit
                        </button>
                        <button
                          className="hover:bg-gray-600 w-full text-start flex items-center gap-2 cursor-pointer border-b border-gray-400 py-2 px-4 text-gray-200"
                          onClick={() => {
                            setOpenDelete(true);
                          }}
                        >
                          <icons.trash className="text-red-500" />
                          Delete
                        </button>
                        <DeleteModal
                          onClose={() => setOpenDelete(false)}
                          onClick={() => handleDelete(vehicle.id)}
                          open={openDelete}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex w-full justify-evenly">
                  <div className="">
                    <img
                      src={vehicle.car_image}
                      alt="car"
                      className="object-contain w-[200px] h-[150px] "
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-gray-800">{vehicle.brand}</p>
                    <p className="text-gray-800">{vehicle.model}</p>
                    <p className="text-gray-800 text-xs">
                      {vehicle.type} • {vehicle.color}
                    </p>
                    <p className="text-white text-sm p-0.5 inline-block text-center bg-gray-800 rounded">
                      {vehicle.plate_number}
                    </p>
                    <div className="flex items-center w-full gap-1">
                      <button
                        disabled={isClicked === vehicle.id}
                        onClick={() => {
                          fetchHistory(vehicle);
                          setIsClicked((prev) =>
                            prev === vehicle.id ? null : vehicle.id
                          );
                        }}
                        className={`gap-4 border ${
                          isClicked === vehicle.id
                            ? " border-green-400"
                            : "  border-gray-600  "
                        } hover:border-gray-400 flex items-center  text-xs  text-gray-800 rounded p-2 cursor-pointer`}
                      >
                        History <icons.rightArrow className="text-sm" />
                      </button>
                      {/* open form to book */}
                      <button
                        onClick={() => {
                          setShowForm(true)
                          setSelectedVehicle(vehicle)}}
                        className="flex  items-center hover:text-gray-800 text-gray-200 gap-4 border border-gray-600 bg-gray-600 hover:bg-gray-300 text-xs p-2 rounded cursor-pointer"
                      >
                        Rent <icons.rightArrow className="text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {selectedHistoryVehicle && (
        <div className="mt-12 p-6 bg-white rounded-xl shadow-2xl  border border-gray-400">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-white text-2xl font-bold">Rental History</h2>
              <p className="text-gray-400">
                Showing records for:{" "}
                <span className="text-[#4E8EA2] font-semibold">
                  {selectedHistoryVehicle.brand} {selectedHistoryVehicle.model}{" "}
                  ({selectedHistoryVehicle.plate_number})
                </span>
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedHistoryVehicle(null);
                setIsClicked(null);
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                });
              }}
              className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors cursor-pointer"
            >
              Close Table
            </button>
          </div>

          <div className="overflow-auto rounded-lg border border-gray-700 ">
            <table className="w-full text-left text-gray-200">
              <thead className="bg-gray-400 text-gray-300 uppercase text-xs">
                <tr>
                  <th className="p-4 border-b border-gray-700 text-gray-800">Id</th>
                  <th className="p-4 border-b border-gray-700 text-gray-800">Created</th>
                  <th className="p-4 border-b border-gray-700 text-gray-800">Renter Name</th>
                  <th className="p-4 border-b border-gray-700 text-gray-800">License #</th>
                  <th className="p-4 border-b border-gray-700 text-gray-800">Start Date</th>
                  <th className="p-4 border-b border-gray-700 text-gray-800">End Date</th>
                  <th className="p-4 border-b border-gray-700 text-gray-800 text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {historyData.length > 0 ? (
                  historyData.map((row, index) => (
                    <tr
                      key={row.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4 font-medium text-gray-800 text-sm">{index + 1}</td>
                      <td className="p-4 font-medium text-gray-800 text-sm">
                        {row.created_at.split("T")[0]}
                      </td>
                      <td className="p-4 font-medium text-gray-800 text-sm">{row.full_name}</td>
                      <td className="p-4  text-gray-800 text-sm">{row.license_number}</td>
                      <td className="p-4 text-gray-800 text-sm">
                        {new Date(row.start_date).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-gray-800 text-sm">
                        {new Date(row.end_date).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-center text-gray-200  ">
                        <span
                          className={`px-3 py-1 rounded-full font-bold uppercase text-[2px] md:text-xs ${
                            row.status === "Completed"
                              ? "bg-red-500"
                              : row.status === "On Service"
                              ? "bg-green-500"
                              : row.status === "On Reservation"
                              ? "bg-blue-500"
                              : "bg-gray-200"
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
                      className="p-10 text-center text-gray-500 italic"
                    >
                      No rental history found for this Vehicle.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className=" flex w-full justify-between items-center mt-4 text-white px-2 pb-6 gap-3">
        <div className="flex items-center sm:justify-start gap-3 w-full">
          <span className="text-sm text-gray-400">
            Showing {historyData.length === 0 ? 0 : indexOfFirstItem + 1} to {""}
            {Math.min(indexOfLastItem, historyData.length)} of {""}
            {historyData.length}
          </span>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <label>Rows per page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset
              }}
              className="bg-gray-200 border border-gray-600 rounded px-2 py-1 text-gray-800 outline-none focus:border-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        <div className="flex gap-5 justify-end ">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className={`bg-border rounded disabled:opacity-30 hover:bg-gray-700 transition cursor-pointer text-xs sm:text-base ${
              currentPage ? "p-2" : ""
            }`}
          >
            Previous
          </button>

          <p className="text-sm text-gray-800">
            Page {currentPage} of {totalPages || 1}
          </p>

          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className={`bg-border rounded disabled:opacity-30 hover:bg-gray-700 transition cursor-pointer text-xs sm:text-base ${
              currentPage ? "p-2 px-4" : ""
            }`}
          >
            Next
          </button>
        </div>
      </div>
        </div>
      )}
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
