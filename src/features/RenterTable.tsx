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

const Renter = () => {
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit" | "view">(
    "create",
  );
  const [selectedData, setSelectedData] =
    useState<DataRenterHistoryProps | null>(null);
  const [renterData, setRenterData] = useState<DataRenterHistoryProps[]>([]);
  const [filterRenterData, setFilterRenterData] = useState<
    DataRenterHistoryProps[]
  >([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = renterData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(renterData.length / itemsPerPage);
  const [searchTerm, setSearchTerm] = useState("");
  //debounce
  const debounceSearchTerm = useDebouncedValue(searchTerm, 200);
  const handleAction = (mode: "create" | "view" | "edit", data: any) => {
    setFormMode(mode);
    setSelectedData(data);
    setOpenForm(true);
  };

  //delete booking
 const handleDelete = async (id: number) => {
  try {
    // 1. Fetch the paths from the database before deleting the row
    const { data: booking, error: fetchError } = await supabase
      .from("renter_booking")
      .select("uploaded_proof")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !booking) {
      toast.error("Booking not found");
      return;
    }

    // 2. Prepare storage deletion tasks
    const storageTasks: Promise<any>[] = [];

    // Handle uploaded_proofs (Array of paths)
    if (booking.uploaded_proof && booking.uploaded_proof.length > 0) {
      const proofPaths = Array.isArray(booking.uploaded_proof) 
        ? booking.uploaded_proof 
        : JSON.parse(booking.uploaded_proof);

      storageTasks.push(
        supabase.storage
          .from("uploaded_proof") // Make sure this bucket name is correct
          .remove(proofPaths)
      );
    }

    // Optional: Delete e_signature from storage if it's a path and not a base64 string
    // If your signature is stored in a bucket, uncomment this:
    /*
    if (booking.e_signature) {
       storageTasks.push(
         supabase.storage.from("signatures").remove([booking.e_signature])
       );
    }
    */

    // 3. Execute Storage deletion
    await Promise.all(storageTasks);

    // 4. Delete the row from the database
    const { error: deleteError } = await supabase
      .from("renter_booking")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    // 5. Update UI State
    setRenterData((prev) => prev.filter((row) => row.id !== id));
    toast.success("Deleted Successfully");
    setOpenDelete(false);
    setSelectedData(null);

  } catch (error) {
    console.error("Failed to delete:", error);
    toast.error("Failed to delete everything");
  }
};
  
//handle print

  //fetch renter
  useEffect(() => {
    const fetchRenter = async () => {
      const { data, error } = await supabase.from("renter_booking").select("*");
      if (error) {
        console.log("Error fetching renter", error);
        return;
      }
      console.log("Fetched Renters", data);
      setRenterData(data);
      setFilterRenterData(data);
    };
    fetchRenter();
    // to fetch data from googleform to supabase to website realtime
    const subscription = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "renter_booking",
        },
        (payload) => {
          const eventType = payload.eventType;
          if (eventType === "INSERT") {
            const newData = payload.new as DataRenterHistoryProps;
            setRenterData((prev) => [newData, ...prev]);
            setFilterRenterData((prev) => [newData, ...prev]); // Sync source of truth
          } else if (eventType === "UPDATE") {
            const updatedData = payload.new as DataRenterHistoryProps;
            const updateFn = (prev: DataRenterHistoryProps[]) =>
              prev.map((item) =>
                item.id === updatedData.id ? updatedData : item,
              );

            setRenterData(updateFn);
            setFilterRenterData(updateFn); // Sync source of truth
          } else if (eventType === "DELETE") {
            const deleteFn = (prev: DataRenterHistoryProps[]) =>
              prev.filter((item) => item.id !== payload.old.id);

            setRenterData(deleteFn);
            setFilterRenterData(deleteFn); // Sync source of truth
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [openForm]);

  useEffect(() => {
    if (!debounceSearchTerm) {
      setRenterData(filterRenterData);
      return;
    }
    let result = filterData(debounceSearchTerm, filterRenterData, [
      "full_name",
      "address",
      "license_number",
      "start_date",
      "end_date",
      "start_time",
      "end_time",
    ]);
    setRenterData(result);
    setCurrentPage(1);
  }, [debounceSearchTerm, filterRenterData]);

  return (
    <div className="bg-body min-h-screen w-full pt-12 px-6 flex flex-col gap-3">
      <div className="flex justify-end w-full">
        <SearchBar
          onClear={() => setSearchTerm("")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="py-2  border border-gray-400 placeholder-white text-white rounded"
          placeholder="Search Renter"
        />
      </div>
      <div className="overflow-x-auto border border-gray-700 w-full">
        <table className="min-w-[1600px] w-full table-fixed text-left    text-gray-200">
          <thead className="bg-[#032d44] text-gray-300 uppercase text-xs">
            <tr>
              <th className="w-full p-4 text-xs border-b text-center border-gray-700">
                Fullname
              </th>
              <th className="w-full p-4 text-xs border-b text-center border-gray-700">
                Address
              </th>
              <th className="w-full p-4 text-xs border-b text-center border-gray-700">
                License #
              </th>
              <th className="w-full p-4 text-xs border-b text-center border-gray-700">
                Car Rented
              </th>
              <th className="w-full p-4 text-xs border-b text-center border-gray-700">
                Start Date
              </th>
              <th className="w-full p-4 text-xs border-b text-center border-gray-700">
                End Date
              </th>
              <th className="w-full p-4 text-xs border-b text-center border-gray-700">
                Pick Up Time
              </th>
              <th className="w-full p-4 text-xs border-b text-center border-gray-700">
                Drop off Time
              </th>
              <th className="w-full p-4 text-xs border-b text-center border-gray-700">
                Duration
              </th>
              <th className="w-full p-4 text-xs border-b text-center border-gray-700">
                Type of Rent
              </th>
              <th className="w-full p-4 text-xs border-b text-center border-gray-700">
                Status
              </th>
              <th className="w-full p-4 text-xs border-b text-center border-gray-700">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 ">
            {currentItems.length > 0 ? (
              currentItems.map((row) => (
                <tr key={row.id} className="hover:bg-white/5 transition-colors">
                  <td className="text-center text-xs font-medium p-4">
                    {row.full_name}
                  </td>
                  <td className="text-center text-xs font-medium p-4">
                    {row.address}
                  </td>
                  <td className="text-center text-xs font-medium p-4">
                    {row.license_number}
                  </td>
                  <td className="text-center text-xs font-medium p-4">
                    {row.car_plate_number}
                  </td>
                  <td className="text-center text-xs font-medium p-4">
                    {row.start_date}
                  </td>
                  <td className="text-center text-xs font-medium p-4">
                    {row.end_date}
                  </td>
                  <td className="text-center text-xs font-medium p-4">
                    {row.start_time}
                  </td>
                  <td className="text-center text-xs font-medium p-4">
                    {row.end_time}
                  </td>
                  <td className="text-center text-xs font-medium p-4">
                    {row.duration}
                  </td>
                  <td className="text-center text-xs font-medium p-4">
                    {row.type_of_rent}
                  </td>
                  <td>
                    <p
                      className={`rounded text-center text-sm  ${
                        row.status === "Completed"
                          ? "bg-red-500"
                          : row.status === "On Service"
                            ? "bg-green-500"
                            : row.status === "On Reservation"
                              ? "bg-blue-500"
                              : "bg-gray-400"
                      }`}
                    >
                      {row.status}
                    </p>
                  </td>
                  <td className="text-center text-xs font-medium p-4">
                    <div className="flex gap-2 mx-auto  justify-center">
                      {/* <button
                        onClick={() => handlePrint(row)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <icons.print className="text-xl cursor-pointer" />
                      </button> */}
                      <button
                        onClick={() => handleAction("view", row)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <icons.openEye className="text-xl cursor-pointer" />
                      </button>
                      <button
                        onClick={() => handleAction("edit", row)}
                        className="flex items-center gap-3"
                      >
                        <icons.edit className="text-xl cursor-pointer" />
                      </button>
                      <button
                        className="flex items-center gap-3 text-red-500 "
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDelete(true);
                        }}
                      >
                        <icons.trash className="text-xl cursor-pointer" />
                      </button>
                      {openDelete && (
                        <DeleteModal
                          onClose={() => setOpenDelete(false)}
                          onClick={() => handleDelete(row.id)}
                          open={openDelete}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="">
                <td colSpan={5} className="p-10   text-gray-500 italic">
                  {searchTerm.length > 0 ? (
                    <span>No Results found for {searchTerm}</span>
                  ) : (
                    <span>No Renter history Existing</span>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className=" flex w-full justify-between items-center mt-4 text-white px-2 pb-6 gap-3">
        <div className="flex items-center sm:justify-start gap-3 w-full">
          <span className="text-sm text-gray-400">
            Showing {renterData.length === 0 ? 0 : indexOfFirstItem + 1} to {""}
            {Math.min(indexOfLastItem, renterData.length)} of {""}
            {renterData.length}
          </span>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <label>Rows per page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset
              }}
              className="bg-[#032d44] border border-gray-600 rounded px-2 py-1 text-white outline-none focus:border-blue-500"
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

          <p className="text-sm">
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
      <RenterForm
        open={openForm}
        mode={formMode}
        selectedData={selectedData}
        onClose={() => setOpenForm(false)}
      />
    </div>
  );
};

export default Renter;
