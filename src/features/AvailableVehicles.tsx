import { BsThreeDots } from "react-icons/bs";
import { CustomButtons } from "../components";
import Card from "../components/Card";
import TableData from "../components/TableData";
import icons from "../constants/icon";
import type { DataVehicleProps } from "../types/types";
import SearchBar from "../components/SearchBar";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "../utils/useDebounce";
import { filterData } from "../utils/FilterData";

const staticData: DataVehicleProps[] = [
  {
    id: 1,
    model: "Civic Lx",
    brand: "Honda",
    type: "sedan",
    color: "Midnight Blue",
    plateNumber: "ABC-1234",
    status: "On Maintenance",
    action: <BsThreeDots />,
  },
  {
    id: 2,
    model: "Civic Lx",
    brand: "Honda",
    type: "sedan",
    color: "Midnight Blue",
    plateNumber: "ABC-1234",
    status: "On Maintenance",
    action: <BsThreeDots />,
  },
  {
    id: 3,
    model: "Civic Lx",
    brand: "Honda",
    type: "sedan",
    color: "Midnight Blue",
    plateNumber: "ABC-1234",
    status: "On Service",
    action: <BsThreeDots />,
  },
  {
    id: 4,
    model: "Civic Lx",
    brand: "Honda",
    type: "sedan",
    color: "Midnight Blue",
    plateNumber: "ABC-1234",
    status: "On Reservations",
    action: <BsThreeDots />,
  },
  {
    id: 5,
    model: "Civic Lx",
    brand: "Honda",
    type: "sedan",
    color: "Midnight Blue",
    plateNumber: "ABC-1234",
    status: "Available",
    action: <BsThreeDots />,
  },
  {
    id: 6,
    model: "Civic Lx",
    brand: "Honda",
    type: "sedan",
    color: "Midnight Blue",
    plateNumber: "ABC-1234",
    status: "Available",
    action: <BsThreeDots />,
  },
  {
    id: 7,
    model: "Civic Lx",
    brand: "Honda",
    type: "sedan",
    color: "Midnight Blue",
    plateNumber: "ABC-1234",
    status: "On Maintenance",
    action: <BsThreeDots />,
  },
  {
    id: 8,
    model: "Civic Lx",
    brand: "Honda",
    type: "sedan",
    color: "Midnight Blue",
    plateNumber: "ABC-1234",
    status: "On Service",
    action: <BsThreeDots />,
  },
  {
    id: 9,
    model: "Civic Lx",
    brand: "Honda",
    type: "sedan",
    color: "Midnight Blue",
    plateNumber: "ABC-1234",
    status: "On Maintenance",
    action: <BsThreeDots />,
  },
  {
    id: 10,
    model: "Civic Lx",
    brand: "Honda",
    type: "sedan",
    color: "Midnight Blue",
    plateNumber: "ABC-1234",
    status: "On Maintenance",
    action: <BsThreeDots />,
  },
];

const columns = [
  {
    name: "No.",
    cell: (row: DataVehicleProps) => <div>{row.id}</div>,
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
    cell: (row: DataVehicleProps) => (
      <div
        className={` px-4 py-1 rounded-full w-full ${
          row.status === "On Service"
            ? "text-white on-service"
            : row.status === "On Reservations"
            ? "text-white on-reservation"
            : row.status === "On Maintenance"
            ? "on-ended text-white"
            : row.status === "Available"
            ? "text-white on-service"
            : "text-gray-400"
        }`}
      >
        {row.status}
      </div>
    ),
  },
  {
    name: "No.",
    cell: (row: DataVehicleProps) => <div>{row.action}</div>,
  },
];

const AvailableVehicles = () => {
  const [records, setRecords] = useState(staticData);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectValue, setSelectValue] = useState("");
  const [selectToggle, setSelectToggle] = useState(false)

  const debounceValue = useDebouncedValue(searchTerm, 200);

  useEffect(() => {
    let result = filterData(debounceValue, staticData, [
      "id",
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
  }, [debounceValue, selectValue]);

  return (
    <div className="w-full h-[600px] overflow-y-auto px-6 mt-12">
      <p className=" text-5xl font-semibold text-gray-600 tracking-wide mb-5 ">
        Vehicles
      </p>
      <div className="flex flex-col gap-10">
         <div className="flex w-full gap-2">
        <Card
          className="on-service"
          title="On Service"
          url={""}
          amount="5"
          description="Total On Service"
          topIcon={<icons.onService className="text-white text-2xl" />}
        />
        <Card
          className="on-reservation"
          title="Reservations"
          url={""}
          amount="5"
          description="Total Reservations"
          topIcon={<icons.onReserve className="text-white text-2xl" />}
        />
        <Card
          className="on-ended"
          title="Maintenance"
          url={""}
          amount="5"
          description="Total Maintenance"
          topIcon={<icons.onMaintenance className="text-white text-2xl" />}
        />
        <Card
          className="on-service"
          title="Available"
          url={""}
          amount="5"
          description="Total Available"
          topIcon={<icons.onAvailable className="text-white text-2xl" />}
        />
      </div>
      <div className="text-end mb-4">
         <CustomButtons
            children="Add Vehicle"
            className="py-2 px-4 rounded menu-bg text-white cursor-pointer"
          />
      </div>
      </div>
      <div className="border border-gray-400 px-6 py-2 rounded ">
        <div className="mt-2 flex justify-end items-center gap-3">
          <div onClick={() => setSelectToggle((t) => !t)} className="flex  items-center border border-gray-200 rounded">
            <select className="outline-none appearance-none px-1 py-2" value={selectValue} onChange={(e) => setSelectValue(e.target.value)} name="" id="">
              <option value="">All</option>
              <option value="On Service">On Service</option>
              <option value="On Reservations">On Reservation</option>
              <option value="On Maintenance">On Maintenance</option>
              <option value="Available">Available</option>
            </select>
            <div className="">{selectToggle ? <icons.up /> : <icons.down />}</div>
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

export default AvailableVehicles;
