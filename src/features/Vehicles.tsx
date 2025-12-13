import { BsThreeDots } from "react-icons/bs";
import Card from "../components/Card";
import TableData from "../components/TableData";
import icons from "../constants/icon";
import type { DataVehicleProps } from "../types/types";
import SearchBar from "../components/SearchBar";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "../utils/useDebounce";
import { filterData } from "../utils/FilterData";
import { VehicleForm } from "../modals";
import { CustomButtons } from "../components/CustomButtons";
import { supabase } from "../utils/supabase";
import { useModalStore } from "../store/useModalStore";

const Vehicles = () => {
  const [records, setRecords] = useState<DataVehicleProps[]>([]);
  const [allrecords, setAllRecords] = useState<DataVehicleProps[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectValue, setSelectValue] = useState("");
  const [selectToggle, setSelectToggle] = useState(false);
  const { open, onOpen, onClose } = useModalStore();

  useEffect(() => {
    onClose();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchVehicles = async () => {
      const { data, error } = await supabase.from("vehicle").select("*");

      if (!isMounted) return;

      if (error) {
        console.log("Error fetching vehicles:", error.message);
      }
      const rows = data ?? [];
      const formattedData = rows.map((item) => ({
        id: item.id,
        model: item.model,
        brand: item.brand,
        type: item.type,
        color: item.color,
        plateNumber: item.plate_no,
        status: item.status,
        action: <BsThreeDots />,
      }));
      setRecords(formattedData);
      setAllRecords(formattedData);
      console.log("Fetched vehicles:", data);
    };
    fetchVehicles();
    return () => {
      isMounted = false;
    };
  }, [open]);

  const debounceValue = useDebouncedValue(searchTerm, 200);

  useEffect(() => {
    let result = filterData(debounceValue, allrecords, [
      "model",
      "brand",
      "type",
      "color",
      "plateNumber",
      "status",
    ]);

    if (selectValue !== "") {
      result = result.filter((item) => item.status === selectValue);
    }
    setRecords(result);
  }, [debounceValue, selectValue, allrecords]);

  const available = records.filter(
    (item) => item.status === "Available"
  ).length;
  const onService = records.filter(
    (item) => item.status === "On Service"
  ).length;
  const onReservation = records.filter(
    (item) => item.status === "On Reservation"
  ).length;
  const onMaintenance = records.filter(
    (item) => item.status === "On Maintenance"
  ).length;

  const columns = [
    {
      name: "No.",
      cell: (_row: DataVehicleProps, index: number) => <div>{index + 1}</div>,
    },
    {
      name: "Model",
      cell: (row: DataVehicleProps) => <div>{row.model}</div>,
    },
    {
      name: "Brand",
      cell: (row: DataVehicleProps) => <div>{row.brand}</div>,
    },
    {
      name: "Type",
      cell: (row: DataVehicleProps) => <div>{row.type}</div>,
    },
    {
      name: "Color",
      cell: (row: DataVehicleProps) => <div>{row.color}</div>,
    },
    {
      name: "Plate #",
      cell: (row: DataVehicleProps) => <div>{row.plateNumber}</div>,
    },
    {
      name: "Status",
      cell: (row: DataVehicleProps) => {
        return (
          <div
            className={` px-1 xl:px-4 py-1 rounded-full w-full  text-[6px] sm:text-[8px] md:text-[9px] lg:text-[10] xl:text-[12px] ${
              row.status === "On Service"
                ? "text-white on-service"
                : row.status === "On Reservation"
                ? "text-white bg-blue-900"
                : row.status === "On Maintenance"
                ? "bg-red-900 text-white"
                : row.status === "Available"
                ? "text-white bg-green-800"
                : "text-gray-400"
            }`}
          >
            {row.status}
          </div>
        );
      },
    },
    {
      name: "Action",
      cell: (row: DataVehicleProps) => <div>{row.action}</div>,
    },
  ];

  return (
    <div className="w-full h-screen relative overflow-y-auto px-6 pt-12 bg-body">
      <p className=" text-5xl font-extrabold  tracking-wide mb-5 text-gray-300">
        Vehicles
      </p>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col xl:flex-row w-full gap-2">
          <Card
            className="bg-border  w-full"
            title={<span className="text-md xl:text-2xl">On Service</span>}
            url={""}
            amount={<span className="text-6xl">{onService}</span>}
            description="Total On Service"
            topIcon={<icons.onService className="text-white text-2xl" />}
          />{" "}
          <Card
            className="bg-border w-full"
            title={<span className="text-md xl:text-2xl">On Reservation</span>}
            url={""}
            amount={<span className="text-6xl">{onReservation}</span>}
            description="Total Reservations"
            topIcon={<icons.onReserve className="text-white text-2xl" />}
          />{" "}
          <Card
            className="bg-border  w-full"
            title={<span className="text-md xl:text-2xl">Maintenance</span>}
            url={""}
            amount={<span className="text-6xl">{onMaintenance}</span>}
            description="Total Maintenance"
            topIcon={<icons.onMaintenance className="text-white text-2xl" />}
          />{" "}
          <Card
            className="bg-border  w-full"
            title={<span className="text-md xl:text-2xl">Available</span>}
            url={""}
            amount={<span className="text-6xl">{available}</span>}
            description="Total Available"
            topIcon={<icons.onAvailable className="text-white text-2xl" />}
          />
        </div>
        <div className="text-end mb-4">
          <CustomButtons
            handleclick={onOpen}
            children="Add Vehicle"
            className="py-2 px-4 rounded bg-[#4E8EA2] hover:bg-[#1d596b] text-white cursor-pointer"
          />
          <VehicleForm open={open} onClose={onClose} />
        </div>
      </div>
      <div className="border border-[#055783] px-6 py-2 rounded ">
        <div className="pb-4 pt-4 flex justify-end items-center gap-3">
          <div
            onClick={() => setSelectToggle((t) => !t)}
            className="flex relative  items-center border border-gray-200 rounded w-full  md:w-44"
          >
            <select
              className="cursor-pointer outline-none appearance-none px-4 py-2 w-full text-xs xl:text-base  text-white"
              value={selectValue}
              onChange={(e) => setSelectValue(e.target.value)}
              name=""
              id=""
            >
              <option value="" className="txt-color">
                All
              </option>
              <option value="On Service" className="txt-color">
                On Service
              </option>
              <option value="On Reservation" className="txt-color">
                On Reservation
              </option>
              <option value="On Maintenance" className="txt-color">
                On Maintenance
              </option>
              <option value="Available" className="txt-color">
                Available
              </option>
            </select>
            <div className="absolute top-2 xl:top-3 right-3 txt-color">
              {selectToggle ? <icons.up /> : <icons.down />}
            </div>
          </div>
          <div>
            <SearchBar
              value={searchTerm}
              onClear={() => setSearchTerm("")}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-border text-white rounded py-2 w-60 "
              placeholder="search"
            />
          </div>
        </div>
        <TableData
          title={<span className="font-bold">Vehicle</span>}
          data={records}
          columns={columns}
          fixedHeader={true}
          pagination={true}
          fixedHeaderScrollHeight="350px"
        />
      </div>
    </div>
  );
};

export default Vehicles;
