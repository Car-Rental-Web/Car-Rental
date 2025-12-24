import icons from "../constants/icon";
import type { DataRenterProps } from "../types/types";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "../utils/useDebounce";
import { filterData } from "../utils/FilterData";
import { supabase } from "../utils/supabase";
import { toast } from "react-toastify";
import { useModalStore } from "../store/useModalStore";
import { Card, SearchBar, TableData } from "../components";
import { DeleteModal } from "../modals";

const RenterHistory = () => {
  const [records, setRecords] = useState<DataRenterProps[]>([]);
  const [filterRecords, setFilterRecords] = useState<DataRenterProps[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const {open, onOpen, onClose} = useModalStore()

  const debounceSearchTerm = useDebouncedValue(searchTerm, 200);

  // delete data or renter's information based on id
  const handleDelete = async (id:number) => {
      const {data, error} = await supabase.from('renter').delete().eq("id", id)

      if(error){
        console.log('Failed to delete', error)
        toast.error('Failed to delete')
      }
      console.log('Delete Successfully', data)
      toast.success('Deleted Successfully')
      setRecords((records) => records.filter((row) => row.id !== id))
      setFilterRecords((records) => records.filter((row) => row.id !== id))
      onClose()
  }

  //fetch renter information that was insert in bookingform
  useEffect(() => {
    let mounted = true;
    const fetchRenter = async () => {
      const { data, error } = await supabase
        .from("renter")
        .select("id, full_name, license_number, times_rented,  notes");

      if (!mounted) return;

      const row = data ?? [];
      const rowData = row.map((item) => ({
        id: item.id,
        full_name: item.full_name,
        times_rented: item.times_rented,
        license_number: item.license_number,
        notes: item.notes,
      }));

      if (error) {
        toast.error('Error Fetching Data')
        console.log("Error Fetching Data", error);
        return;
      }
      console.log("Fetch Renters", data);
      setFilterRecords(rowData);
      setRecords(rowData);
    };
    fetchRenter();
    return () => {
      mounted = false;
    };
  }, [open]);

  //search filter
  useEffect(() => {
    const result = filterData(debounceSearchTerm, filterRecords, [
      "id",
      "full_name",
      "license_number",
      // "lastDateRented",
      "times_rented",
      "notes",
    ]);
    setRecords(result);
  }, [debounceSearchTerm, filterRecords]);


//table columns
  const columns = [
    {
      name: "No.",
      cell: (_row: DataRenterProps, index:number) => (
        <div className="text-center">{index + 1}</div>
      ),
    },
    {
      name: "Name",
      cell: (row: DataRenterProps) => (
        <div className="text-center">{row.full_name}</div>
      ),
    },
    {
      name: "License #",
      cell: (row: DataRenterProps) => (
        <div className="text-center">{row.license_number}</div>
      ),
    },
    // {
    //   name: "Last Date Rented",
    //   cell: (row: DataRenterProps) => (
    //     <div className=" w-full text-center">
    //       {new Date(row.lastDateRented).toLocaleString("en-US", {
    //         month: "2-digit",
    //         day: "2-digit",
    //         year: "numeric",
    //       })}
    //     </div>
    //   ),
    // },
    {
      name: "Times Rented",
      cell: (row: DataRenterProps) => (
        <div className="text-center w-full">{row.times_rented}</div>
      ),
    },
    {
      name: "Feedback",
      cell: (row: DataRenterProps) => (
        <div className="text-center  w-full">{row.notes}</div>
      ),
    },
    {
      name: "Action",
      cell: (row: DataRenterProps) => (
        <div className="flex gap-2">
          <icons.trash
            className="cursor-pointer text-red-400 text-xl"
            onClick={onOpen}
          />
          <DeleteModal open={open} onClose={onClose} onClick={() => handleDelete(row.id)}/>
        </div>
      ),
    },
  ];

const totalRenter = records.length
  return (
    <div className="w-full h-screen  overflow-y-auto flex flex-col gap-5 pb-2  pt-12 px-6 bg-body">
      <div className="">
        <p className="text-5xl font-semibold text-gray-300 tracking-wide mb-5">
          Renter History
        </p>
        <div className="flex flex-col xl:flex-row gap-2">
          <Card
            className="bg-border w-full"
            title={<span className="text-md xl:text-2xl">Renters</span>}
            url={""}
            amount={<span className="text-6xl">{totalRenter}</span>}
            description="Total Renters"
            topIcon={<icons.person className="text-white text-2xl" />}
          />
          <Card
            className="bg-border w-full"
            title={<span className="text-md xl:text-2xl"> Active Renters</span>}
            url={""}
            amount={<span className="text-6xl">200</span>}
            description="Total Active Renters"
            topIcon={<icons.person className="text-white text-2xl" />}
          />
          {/* <Card
            className="bg-border w-full"
            title={
              <span className="text-md xl:text-2xl">Inactive Renters</span>
            }
            url={""}
            amount={<span className="text-6xl">200</span>}
            description="Total Inactive Service"
            topIcon={<icons.person className="text-white text-2xl" />}
          /> */}
        </div>
      </div>
      <div className="w-full flex flex-col  px-6 border border-[#055783] py-4 rounded">
        <div className="justify-end flex pb-4 pt-4">
          <SearchBar
            onClear={() => setSearchTerm("")}
            value={searchTerm}
            className=" absolute bg-gray-100 rounded py-2 w-60 "
            placeholder="Search"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <TableData
            progressPending={false}
            title={<span className="font-bold">Renter History</span>}
            data={records}
            columns={columns}
            pagination={true}
            fixedHeader={true}
            responsive={true}
            fixedHeaderScrollHeight="400px"
          />
        </div>
      </div>
    </div>
  );
};

export default RenterHistory;
