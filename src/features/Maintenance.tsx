import Card from "../components/Card";
import icons from "../constants/icon";
import type { DataMaintenanceProps } from "../types/types";
import TableData from "../components/TableData";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "../utils/useDebounce";
import { filterData } from "../utils/FilterData";
import SearchBar from "../components/SearchBar";
import { MaintenanceForm } from "../modals";
import { CustomButtons } from "../components/CustomButtons";
import { supabase } from "../utils/supabase";
import { BsThreeDots } from "react-icons/bs";
import { toast } from "react-toastify";



const Maintenance = () => {
  const [records, setRecords] = useState<DataMaintenanceProps[]>([]);
  const [allrecords, setAllRecords] = useState<DataMaintenanceProps[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectValue, setSelectValue] = useState("");
  const [selectToggle, setSelectToggle] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchMaintenance = async () => {
      const { data, error } = await supabase.from("maintenance").select("*");
      if (!isMounted) return;

      if (error) {
        console.log("Error fetching maintenance:", error?.message);
        return;
      }

      const row = data ?? [];
      const rowsData = row.map((item) => ({
        id: item.id,
        date: item.date,
        car: item.car,
        typeOfMaintenance: item.type_of_maintenance,
        costOfMaintenance: item.cost_of_maintenance,
        location: item.location,
        maintainedBy: item.maintained_by,
        status: item.status,
        action: <BsThreeDots />,
      }));
      setRecords(rowsData);
      setAllRecords(rowsData);
      console.log("Fetched vehicles:", data);
    };
    fetchMaintenance();
    return () => {
      isMounted = false;
    };
  }, [openModal]);


  const handleUpdate = async (id:number, vehicleId: string) => {
      const {data, error} = await supabase.from('maintenance').update({status: "Maintained"}).eq("id", id)

      if(error){
        console.log("Error Updating", error)
      }
      console.log('Update Successfully' , data)

      const {data:vehicleStatus, error: errorStatus} = await supabase.from('vehicle').update({status: "Available"}).eq("id", vehicleId)
      if(errorStatus) {
        console.log("Vehicle Update Error" , errorStatus)
        toast.error("Error Updating")
      }
      console.log(vehicleStatus)
      toast.success("Update Successfully")
      setRecords((prev) => prev.map((row) => row.id === id ? {...row, status: "Maintained"} : row))
  }

  const debounceSearchTerm = useDebouncedValue(searchTerm, 200);

  useEffect(() => {
    let result = filterData(debounceSearchTerm, allrecords, [
      "id",
      "date",
      "car",
      "typeOfMaintenance",
      "costOfMaintenance",
      "location",
      "maintainedBy",
      "status",
    ]);

    if (selectValue !== "") {
      result = result.filter((item) => item.status === selectValue);
    }
    setRecords(result);
  }, [debounceSearchTerm, selectValue, allrecords]);

  //TOTAL COUNT OF MAINTENANCE
  const totalExpense = records.reduce(
    (sum, row) => sum + Number(row.costOfMaintenance),
    0
  );
  const ongoing = records.filter((r) => r.status === "On Maintenance").length;
  const maintained = records.filter((r) => r.status === "Maintained").length;

  const columns = [
  {
    name: "No.",
    cell: (_row: DataMaintenanceProps, index: number) => <div>{index + 1}</div>,
  },
  {
    name: "Date",
    cell: (row: DataMaintenanceProps) => (
      <div>
        {new Date(row.date).toLocaleString("en-Us", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        })}
      </div>
    ),
  },
  {
    name: "Car",
    cell: (row: DataMaintenanceProps) => <div>{row.car}</div>,
  },
  {
    name: "Type of Maintenance",
    cell: (row: DataMaintenanceProps) => <div>{row.typeOfMaintenance}</div>,
  },
  {
    name: "Cost of Maintenance",
    cell: (row: DataMaintenanceProps) => <div>{row.costOfMaintenance}</div>,
  },
  {
    name: "Location",
    cell: (row: DataMaintenanceProps) => <div>{row.location}</div>,
  },
  {
    name: "Maintained By",
    cell: (row: DataMaintenanceProps) => <div>{row.maintainedBy}</div>,
  },
  {
    name: "Status",
    cell: (row: DataMaintenanceProps) => (
      <div
        className={`rounded-full w-full px-2 py-1 text-[6px] sm:text-[8px] md:text-[9px] lg:text-[10] xl:text-[12px] ${
          row.status === "On Maintenance"
            ? "text-white on-ended"
            : row.status === "Maintained"
            ? "text-white on-reservation"
            : "text-gray-50"
        }`}
      >
        {row.status}
      </div>
    ),
  },
  {
    name: "Action",
    cell: (row: DataMaintenanceProps) => (
      <div>
        <button className="cursor-pointer" onClick={() => handleUpdate(row.id, row.car)} > {row.action}</button>
      </div>
    ),
  },
];

  return (
    <div className="px-6 pt-12 w-full relative  overflow-y-auto gap-2">
      <p className=" text-5xl font-semibold text-gray-600 tracking-wide mb-5 ">
        Maintenance
      </p>
      <div className="flex flex-col gap-10 w-full">
        <div className="flex flex-col xl:flex-row gap-2">
          <Card
            className="bg-red-400 w-full"
            title={<span className="text-md xl:text-2xl">Expense</span>}
            url={""}
            amount={<span className="text-6xl">{totalExpense}</span>}
            description="Total Maintenance Expense"
            topIcon={<icons.money className="text-white text-2xl" />}
          />
          <Card
            className="menu-bg w-full"
            title={
              <span className="text-md xl:text-2xl">Maintenance Count</span>
            }
            url={""}
            amount={<span className="text-6xl">{maintained}</span>}
            description="Total Maintenance Count"
            topIcon={<icons.onMaintenance className="text-white text-2xl" />}
          />
          <Card
            className="on-ended w-full"
            title={
              <span className="text-md xl:text-2xl">Ongoing Maintenance</span>
            }
            url={""}
            amount={<span className="text-6xl">{ongoing}</span>}
            description="Total Ongoing Maintenance"
            topIcon={<icons.onMaintenance className="text-white text-2xl" />}
          />
        </div>
        <div className="text-end mb-4">
          <CustomButtons
            handleclick={() => setOpenModal(true)}
            children="Add Maintenance"
            className="py-2 px-4 rounded menu-bg text-white cursor-pointer"
          />
          <MaintenanceForm
            open={openModal}
            onClose={() => setOpenModal(false)}
          />
        </div>
      </div>

      <div className="border border-gray-400 px-6 py-2 rounded ">
        <div className="mt-2 flex justify-end items-center gap-3">
          <div
            onClick={() => setSelectToggle((t) => !t)}
            className=" flex relative  items-center border border-gray-200 rounded w-full  md:w-44"
          >
            <select
              className="cursor-pointer outline-none appearance-none px-4 py-2 w-full text-xs xl:text-base "
              value={selectValue}
              onChange={(e) => setSelectValue(e.target.value)}
              name=""
              id=""
            >
              <option value="">All</option>
              <option value="On Maintenance">On Maintenance</option>
              <option value="Maintained">Maintained</option>
            </select>
            <div className="absolute top-2 xl:top-3 right-3">
              {" "}
              {selectToggle ? <icons.up /> : <icons.down />}
            </div>
          </div>
          <div>
            <SearchBar
              value={searchTerm}
              onClear={() => setSearchTerm("")}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-100 rounded py-2 w-60 "
              placeholder="search"
            />
          </div>
        </div>
        <TableData
          title={<span className="font-bold">Maintenance</span>}
          pagination={true}
          fixedHeader={true}
          fixedHeaderScrollHeight="350px"
          data={records}
          columns={columns}
        />
      </div>
    </div>
  );
};

export default Maintenance;
