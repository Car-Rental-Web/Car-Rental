import { useEffect, useState } from "react";
import type { DataRenterHistoryProps } from "../types/types";
import { supabase } from "../utils/supabase";
import { Card, SearchBar } from "../components";
import icons from "../constants/icon";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";
import { useDebouncedValue } from "../utils/useDebounce";
import { filterData } from "../utils/FilterData";
import { toast } from "react-toastify";
import { DeleteModal } from "../modals";
import RenterForm from "../components/RenterForm";
import { usePagination } from "../utils/Pagination";

const RenterProfile = () => {
  const [renterHistory, setRenterHistory] = useState<any[]>([]);
  const [renterData, setRenterData] = useState<DataRenterHistoryProps[]>([]); // set data for fetched data
  const [totalRenter, setTotalRenter] = useState<DataRenterHistoryProps[]>([]); //total renter count for card
  const [filterRenterData, setFilterRenterData] = useState<
    DataRenterHistoryProps[]
  >([]); // use to filter data
  const [searchTerm, setSearchTerm] = useState("");
  //pagination

  const {
    currentPage,
    itemsPerPage,
    setItemsPerPage,
    setCurrentPage,
    currentItems,
    totalPages,
    indexOfFirstItem,
    indexOfLastItem,
  } = usePagination(renterData, 5);

  const mainPagination = usePagination(renterData, 5);
  const historyPagination = usePagination(renterHistory, 5);

  //debounce
  const debounceSearchTerm = useDebouncedValue(searchTerm, 200);
  const [openDelete, setOpenDelete] = useState(false);
  // form
  const [selectedRenter, setSelectedRenter] =
    useState<DataRenterHistoryProps | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [showForm, setShowForm] = useState(false);

  //delete data in table
  const handleDelete = async (renterId: number) => {
    const { data, error } = await supabase
      .from("renter")
      .delete()
      .eq("id", renterId);

    if (error) {
      toast.error("Failed to Delete");
      console.log("Failed to Delete", error);
      return;
    }
    setRenterData((prev) => prev.filter((row) => row.id !== renterId));
    setFilterRenterData((prev) => prev.filter((row) => row.id !== renterId));
    toast.success("Renter Deleted Successfully");
    console.log("Renter Deleted Successfully", data);
    setOpenDelete(false);
  };

  //search renters
  useEffect(() => {
    let result = filterData(debounceSearchTerm, filterRenterData, [
      "full_name",
      "address",
      "license_number",
      "philhealth_number",
      "tin_number",
      "sss_number",
      "pagibig_number",
      "times_rented",
    ]);
    setRenterData(result);
    setCurrentPage(1);
  }, [debounceSearchTerm, filterRenterData]);

  //fetch renters
  useEffect(() => {
    const fetchRenter = async () => {
      const { data, error } = await supabase
        .from("renter")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.log("Error Fetching", error);
        return;
      }
      console.log("Fetched Renter", data);
      setRenterData(data);
      setFilterRenterData(data);
      setTotalRenter(data);
    };
    fetchRenter();
    // to fetch data from googleform to supabase to website realtime
    const subscription = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "renter",
        },
        (payload: RealtimePostgresInsertPayload<DataRenterHistoryProps>) => {
          setRenterData((prev) => [
            payload.new as DataRenterHistoryProps,
            ...prev,
          ]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [openDelete]);

  // all renters count
  let allRenter = totalRenter.length;

  //fetch renter history
  useEffect(() => {
    const fetchRenterHistory = async () => {
      const { data, error } = await supabase
        .from("renter_booking")
        .select("*")
        .eq("full_name", selectedName);
      if (!selectedName) return;
      if (error) {
        console.log("Error Fetching Renter History", error);
        return;
      }

      console.log("Fetched Renter History", data);
      setRenterHistory(data);
    };
    fetchRenterHistory();
  }, [selectedName]);

  return (
    <div className="bg-body  min-h-screen w-full pt-12 px-6 flex flex-col gap-3">
      <div className="flex gap-3">
        <Card
          className="bg-border w-full"
          title={<span className="text-md xl:text-2xl">Renters</span>}
          url={""}
          amount={<span className="text-6xl">{allRenter}</span>}
          description="Total Renters"
          topIcon={<icons.person className="text-white text-2xl" />}
        />
        <Card
          className="bg-border w-full"
          title={<span className="text-md xl:text-2xl">Renters</span>}
          url={""}
          amount={<span className="text-6xl">{allRenter}</span>}
          description="Total Renters"
          topIcon={<icons.person className="text-white text-2xl" />}
        />
      </div>
      <div className="flex justify-end w-full">
        <SearchBar
          onClear={() => setSearchTerm("")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="py-2  border border-gray-400 placeholder-white text-white rounded"
          placeholder="Search Renter"
        />
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-700  w-full">
        <table className="min-w-[1600px] w-full table-fixed text-left    text-gray-200">
          <thead className="bg-[#032d44] text-gray-300 uppercase text-xs ">
            <tr className="text-center">
              <th className="w-full p-4 text-xs border-b text-center border-gray-700">
                ID
              </th>
              <th className="w-full p-4 text-xs border-b text-center border-gray-700">
                Created
              </th>
              <th className="w-full p-4 text-xs border-b text-center border-gray-700">
                Renter Name
              </th>
              <th className="w-full p-4 text-xs border-b text-center border-gray-700">
                Times Rented
              </th>
              <th className="w-full p-4 text-xs text-center border-b border-gray-700">
                Address
              </th>
              <th className="w-full p-4 text-xs border-b text-center border-gray-700">
                License #
              </th>
              <th className="w-full p-4 text-xs border-b text-center border-gray-700">
                PhilHealth No.
              </th>
              <th className="w-full p-4 text-xs text-center border-b border-gray-700">
                Tin No.
              </th>
              <th className="w-full p-4 text-xs text-center border-b border-gray-700">
                SSS No.
              </th>
              <th className="w-full p-4 text-xs border-b text-center border-gray-700">
                Pagibig No.
              </th>
              <th className="w-full p-4 text-xs  border-b text-center border-gray-700">
                Valid ID.
              </th>
              <th className="w-full p-4 text-xs  border-b text-center border-gray-700">
                Signature
              </th>
              <th className="w-full p-4 text-xs text-center border-b border-gray-700">
                Rent
              </th>
              <th className="w-full p-4 text-xs text-center border-b border-gray-700">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 relative ">
            {currentItems.length > 0 ? (
              mainPagination.currentItems.map((row, index) => (
                <tr
                  onClick={() => setSelectedName(row.full_name)}
                  key={row.id}
                  className="hover:bg-white/5 transition-colors cursor-pointer "
                >
                  <td className=" text-center text-xs font-medium p-4 ">
                    {indexOfFirstItem + index + 1}
                  </td>
                  <td className=" text-center text-xs p-4 ">
                    {row.created_at.split("T")[0]}
                  </td>
                  <td className=" text-center text-xs p-4 ">
                    {row.full_name || "N/A"}
                  </td>
                  <td className=" text-center text-xs p-4 ">
                    {row.times_rented}
                  </td>
                  <td className=" text-center text-xs font-">
                    {row.address || "N/A"}
                  </td>
                  <td className=" text-center text-xs p-4 ">
                    {row.license_number || "N/A"}
                  </td>
                  <td className=" text-center text-xs p-4 ">
                    {row.philhealth_number || "N/A"}
                  </td>
                  <td className=" text-center text-xs p-4 ">
                    {row.tin_number || "N/A"}
                  </td>
                  <td className=" text-center text-xs p-4 ">
                    {row.sss_number || "N/A"}
                  </td>
                  <td className=" text-center text-xs p-4  ">
                    {row.pagibig_number || "N/A"}
                  </td>
                  <td className=" text-center p-4 ">
                    <img
                      className="w-12 mx-auto"
                      alt="valid_id"
                      src={row.valid_id}
                    ></img>
                  </td>
                  <td className=" text-center p-4  ">
                    <img
                      className="w-12 mx-auto"
                      alt="e_signature"
                      src={row.e_signature}
                    ></img>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={(e) => {
                        setSelectedRenter(row);
                        setShowForm(true);
                        e.stopPropagation()
                      }}
                    >
                      <icons.rent className="mx-auto text-xl text-green-500 cursor-pointer" />
                    </button>
                  </td>

                  <td className=" text-center ">
                    <div className="flex gap-2 mx-auto  justify-center">
                      <button className="flex items-center gap-3">
                        <icons.openEye />
                      </button>
                      <button className="flex items-center gap-3">
                        <icons.edit />
                      </button>
                      <button
                        className="flex items-center gap-3 text-red-500 "
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDelete(true);
                        }}
                      >
                        <icons.trash className="cursor-pointer" />
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
            onClick={mainPagination.goToPreviousPage}
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
            onClick={mainPagination.goToNextPage}
            className={`bg-border rounded disabled:opacity-30 hover:bg-gray-700 transition cursor-pointer text-xs sm:text-base ${
              currentPage ? "p-2 px-4" : ""
            }`}
          >
            Next
          </button>
        </div>
      </div>
      {selectedName && (
        <div className="mt-8 p-6 border border-gray-700 rounded-lg bg-[#032d44] text-white animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header with Close Button */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-blue-400">
                History: <span className="text-white">{selectedName}</span>
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Showing all previous and current booking records
              </p>
            </div>
            <button
              onClick={() => setSelectedName("")}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-md transition-all text-sm flex items-center gap-3 justify-center cursor-pointer"
            >
              Close View <icons.closeModal />
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded border border-gray-700">
            <table className="w-full text-left border-collapse">
              <thead className="bg-black/30 text-gray-400 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="p-4 border-b border-gray-700">Car Rented</th>
                  <th className="p-4 border-b border-gray-700">Start Date</th>
                  <th className="p-4 border-b border-gray-700">End Date</th>
                  <th className="p-4 border-b border-gray-700">Type</th>
                  <th className="p-4 border-b border-gray-700">Location</th>
                  <th className="p-4 border-b border-gray-700 text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-black/10">
                {renterHistory.length > 0 ? (
                  renterHistory.map((history) => (
                    <tr
                      key={history.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4 text-sm font-bold text-blue-400">
                        {history.car_plate_number}
                      </td>
                      <td className="p-4 text-sm text-gray-300">
                        {history.start_date}
                      </td>
                      <td className="p-4 text-sm text-gray-300">
                        {history.end_date}
                      </td>
                      <td className="p-4 text-sm">
                        <span className="bg-gray-700/50 px-2 py-1 rounded text-[10px]">
                          {history.type_of_rent}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-400 italic">
                        {history.location || "N/A"}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                            history.status === "Completed"
                              ? "text-red-400 bg-red-400/10"
                              : "text-green-400 bg-green-400/10"
                          }`}
                        >
                          {history.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-12 text-center text-gray-500 italic"
                    >
                      No history records found for this renter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className=" flex w-full justify-between items-center mt-4 text-white px-2 pb-6 gap-3">
              <div className="flex items-center sm:justify-start gap-3 w-full">
                <span className="text-sm text-gray-400">
                  Showing {renterData.length === 0 ? 0 : indexOfFirstItem + 1}{" "}
                  to {""}
                  {Math.min(indexOfLastItem, renterData.length)} of {""}
                  {renterData.length}
                </span>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <label>Rows per page:</label>
                  <select
                    value={historyPagination.itemsPerPage}
                    onChange={(e) => {
                      historyPagination.setItemsPerPage(Number(e.target.value));
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
                  onClick={historyPagination.goToPreviousPage}
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
                  onClick={historyPagination.goToNextPage}
                  className={`bg-border rounded disabled:opacity-30 hover:bg-gray-700 transition cursor-pointer text-xs sm:text-base ${
                    currentPage ? "p-2 px-4" : ""
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <RenterForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedRenter(null);
        }}
        selectedData={selectedRenter}
      /> 
    </div>
  );
};

export default RenterProfile;
