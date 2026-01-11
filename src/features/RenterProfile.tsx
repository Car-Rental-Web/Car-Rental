import { useEffect, useState } from "react";
import type { DataRenterHistoryProps } from "../types/types";
import { supabase } from "../utils/supabase";
import { Card, SearchBar } from "../components";
import icons from "../constants/icon";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";
import { useDebouncedValue } from "../utils/useDebounce";
import { filterData } from "../utils/FilterData";
import { BsThreeDots } from "react-icons/bs";

const RenterProfile = () => {
  const [renterData, setRenterData] = useState<DataRenterHistoryProps[]>([]); // set data for fetched data
  const [totalRenter, setTotalRenter] = useState<DataRenterHistoryProps[]>([]); //total renter count for card
  const [filterRenterData, setFilterRenterData] = useState<
    DataRenterHistoryProps[]
  >([]); // use to filter data
  const [searchTerm, setSearchTerm] = useState("");
  //debounce
  const debounceSearchTerm = useDebouncedValue(searchTerm, 200);
  //pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = renterData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(renterData.length / itemsPerPage);

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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // all renters count
  let allRenter = totalRenter.length;

  return (
    <div className="bg-body min-h-screen w-full pt-12 px-6 flex flex-col gap-3">
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
      <div className="overflow-x-auto rounded-lg border border-gray-700 py-4 px-6  w-full">
        <table className="min-w-[1600px] w-full table-fixed text-left    text-gray-200">
          <thead className="bg-[#032d44] text-gray-300 uppercase text-xs ">
            <tr className="text-center">
              <th className="w-full p-4 text-xs border-b text-left border-gray-700">
                ID
              </th>
              <th className="w-full p-4 text-xs border-b border-gray-700">
                Created
              </th>
              <th className="w-full p-4 text-xs border-b border-gray-700">
                Renter Name
              </th>
              <th className="w-full p-4 text-xs border-b border-gray-700">
                Times Rented
              </th>
              <th className="w-full p-4 text-xs text-center border-b border-gray-700">
                Address
              </th>
              <th className="w-full p-4 text-xs border-b border-gray-700">
                License #
              </th>
              <th className="w-full p-4 text-xs border-b border-gray-700">
                PhilHealth No.
              </th>
              <th className="w-full p-4 text-xs text-center border-b border-gray-700">
                Tin No.
              </th>
              <th className="w-full p-4 text-xs text-center border-b border-gray-700">
                SSS No.
              </th>
              <th className="w-full p-4 text-xs border-b border-gray-700">
                Pagibig No.
              </th>
              <th className="w-full p-4 text-xs text-left border-b border-gray-700">
                Valid ID.
              </th>
              <th className="w-full p-4 text-xs text-left border-b border-gray-700">
                Signature
              </th>
              <th className="w-full p-4 text-xs text-left border-b border-gray-700">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 ">
            {currentItems.length > 0 ? (
              currentItems.map((row, index) => (
                <tr key={row.id} className="hover:bg-white/5 transition-colors">
                  <td className=" text-left text-xs font-medium pl-4">
                    {indexOfFirstItem + index + 1}
                  </td>
                  <td className=" text-center text-xs ">
                    {row.created_at.split("T")[0]}
                  </td>
                  <td className=" text-center text-xs ">
                    {row.full_name.toUpperCase()}
                  </td>
                  <td className=" text-center text-xs ">{row.times_rented}</td>
                  <td className=" text-center text-xs font-">
                    {row.address.toUpperCase()}
                  </td>
                  <td className=" text-center text-xs ">
                    {row.license_number.toUpperCase()}
                  </td>
                  <td className=" text-center text-xs ">
                    {row.philhealth_number.toUpperCase() || "N/A "}
                  </td>
                  <td className=" text-center text-xs ">
                    {row.tin_number.toUpperCase() || "N/A "}
                  </td>
                  <td className=" text-center text-xs ">
                    {row.sss_number.toUpperCase() || "N/A "}
                  </td>
                  <td className=" text-center text-xs  ">
                    {row.pagibig_number.toUpperCase() || "N/A "}
                  </td>
                  <td className="   ">
                    <img className="w-12" src={row.valid_id}></img>
                  </td>
                  <td className="  ">
                    <img className="w-12" src={row.e_signature}></img>
                  </td>
                  <td className=" p-4 flex gap-1">
                    {/* VIEW */}
                    <button>
                      <BsThreeDots />
                    </button>
                    {/* Edit */}
                    <button>
                      <BsThreeDots />
                    </button>
                    {/* Delete */}
                    <button>
                      <BsThreeDots />
                    </button>
                    {/* Rent / will show the booking*/}
                    <button>
                      <BsThreeDots />
                    </button>
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
    </div>
  );
};

export default RenterProfile;
