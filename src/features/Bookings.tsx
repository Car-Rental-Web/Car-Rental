import { useEffect, useState } from "react";
import TableData from "../components/TableData";
import type { DataBookingProps } from "../types/types";
import { BsThreeDots } from "react-icons/bs";
import { useDebouncedValue } from "../utils/useDebounce";
import { filterData } from "../utils/FilterData";
import SearchBar from "../components/SearchBar";
import { CustomButtons } from "../components";
import Card from "../components/Card";
import icons from "../constants/icon";

const staticData: DataBookingProps[] = [
  {
    id: 1,
    name: "Vince",
    license: "D12-34-567890",
    carType: "Honda",
    model: "Cr-V",
    startDate: new Date(),
    endDate: new Date(),
    location: "Angeles",
    typeOfRent: "self-drive",
    status: "On Service",
    action: <BsThreeDots />,
  },
  {
    id: 2,
    name: "Martin Bautista",
    license: "D12-34-567890",
    carType: "Toyota",
    model: "Vios",
    startDate: new Date(),
    endDate: new Date(),
    location: "Angeles",
    typeOfRent: "self-drive",
    status: "Ended",
    action: <BsThreeDots />,
  },
  {
    id: 3,
    name: "Marthy Gomez",
    license: "D12-34-567890",
    carType: "Ford",
    model: "Raptor",
    startDate: new Date(),
    endDate: new Date(),
    location: "Angeles",
    typeOfRent: "with Driver",
    status: "Reserved",
    action: <BsThreeDots />,
  },
  {
    id: 4,
    name: "Em Boss",
    license: "D12-34-567890",
    carType: "Hyundai",
    model: "Santa Fe",
    startDate: new Date(),
    endDate: new Date(),
    location: "Angeles",
    typeOfRent: "self-drive",
    status: "On Service",
    action: <BsThreeDots />,
  },
  {
    id: 5,
    name: "Em Boss",
    license: "D12-34-567890",
    carType: "Hyundai",
    model: "Santa Fe",
    startDate: new Date(),
    endDate: new Date(),
    location: "Angeles",
    typeOfRent: "with Driver",
    status: "On Service",
    action: <BsThreeDots />,
  },
  {
    id: 6,
    name: "Em Boss",
    license: "D12-34-567890",
    carType: "Hyundai",
    model: "Santa Fe",
    startDate: new Date(),
    endDate: new Date(),
    location: "Angeles",
    typeOfRent: "with Driver",
    status: "On Service",
    action: <BsThreeDots />,
  },
  {
    id: 7,
    name: "Em Boss",
    license: "D12-34-567890",
    carType: "Hyundai",
    model: "Santa Fe",
    startDate: new Date(),
    endDate: new Date(),
    location: "Angeles",
    typeOfRent: "self-drive",
    status: "On Service",
    action: <BsThreeDots />,
  },
  {
    id: 8,
    name: "Em Boss",
    license: "D12-34-567890",
    carType: "Hyundai",
    model: "Santa Fe",
    startDate: new Date(),
    endDate: new Date(),
    location: "Angeles",
    typeOfRent: "self-drive",
    status: "On Service",
    action: <BsThreeDots />,
  },
  {
    id: 9,
    name: "Em Boss",
    license: "D12-34-567890",
    carType: "Hyundai",
    model: "Santa Fe",
    startDate: new Date(),
    endDate: new Date(),
    location: "Angeles",
    typeOfRent: "self-drive",
    status: "Reserved",
    action: <BsThreeDots />,
  },
  {
    id: 10,
    name: "Em Boss",
    license: "D12-34-567890",
    carType: "Hyundai",
    model: "Santa Fe",
    startDate: new Date(),
    endDate: new Date(),
    location: "Angeles",
    typeOfRent: "self-drive",
    status: "On Service",
    action: <BsThreeDots />,
  },
  {
    id: 11,
    name: "Em Boss",
    license: "D12-34-567890",
    carType: "Hyundai",
    model: "Santa Fe",
    startDate: new Date(),
    endDate: new Date(),
    location: "Angeles",
    typeOfRent: "self-drive",
    status: "On Service",
    action: <BsThreeDots />,
  },
];

const columns = [
  {
    name: "No.",
    cell: (row:DataBookingProps) => <div className="text-center font-semibold ">{row.id}</div>,
  },
  {
    name: "Name",
    cell: (row:DataBookingProps) => <div className="text-center font-semibold">{row.name}</div>,
   
  },
  {
    name: "License #",
    cell: (row:DataBookingProps) => <div className="text-center font-semibold">{row.license}</div>,
    
  },
  {
    name: "Car",
    cell: (row:DataBookingProps) => <div className="text-center font-semibold">{row.carType}</div>,
    
  },
  {
    name: "Model",
    cell: (row:DataBookingProps) => <div className="text-center font-semibold">{row.model}</div>,
    
  },
  {
    name: "Start Date",
     cell: (row: DataBookingProps) => (
    <div className="text-center ">
      {new Date(row.startDate).toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })}
    </div>
  ),
  },
  {
    name: "End Date",
     cell: (row: DataBookingProps) => (
    <div className="text-center ">
      {new Date(row.endDate).toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })}
    </div>
  ),
  },
  {
    name: "Location",
    cell: (row: DataBookingProps) => <div className="text-center ">{row.location}</div>,
  },
  {
    name: "Type of Rent",
    cell: (row: DataBookingProps) => (
        <div>{row.typeOfRent}</div>
    )
  },
  {
    name: "Status",
    cell: (row: DataBookingProps) => (
      <span
        className={`text-xs text-center px-4 py-1 ${
          row.status === "On Service"
            ? "on-service text-white  rounded-full w-full text-center"
            : row.status === "Reserved"
            ? " on-reservation  rounded-full text-white w-full text-center"
            : row.status === "Ended"
            ? "on-ended text-white  rounded-full w-full text-center"
            : "text-gray-400"
        }`}
      >
        {row.status}
      </span>
    ),
  
  },
  {
    name: "Action",
    cell: (row: DataBookingProps) => <div className="">{row.action}</div>
   
  },
];

const Bookings = () => {
  const [records, setRecords] = useState(staticData);
  const [searchTerm, setSearchTerm] = useState("");
  const [toggle, setToggle] = useState(false);
  const [selectValue, setSelectValue] = useState("");

  const debounceSearchTerm = useDebouncedValue(searchTerm, 200);

  useEffect(() => {
    let result = filterData(debounceSearchTerm, staticData, [
      "carType",
      "model",
      "startDate",
      "license",
      "endDate",
      "location",
      "name",
      "status",
    ]);

    if(selectValue !== "") {
      result = result.filter((item) => item.status === selectValue)
    }
    setRecords(result);
  }, [debounceSearchTerm, selectValue]);

  return (
    <div className="w-full  overflow-y-auto  flex flex-col gap-5 rounded-lg mt-12 px-6">
      <div className="">
        <p className="text-5xl font-semibold text-gray-600 tracking-wide mb-5">
          Bookings
        </p>
        <div className="flex gap-2">
          <Card
            className="on-service"
            title="On Service"
            url={""}
            amount="5"
            description="Total Booked On Service"
            topIcon={<icons.onService className="text-white text-2xl" />}
          />
          <Card
            className="on-reservation"
            title="Reservation"
            url={""}
            amount="5"
            description="Total Booked Reservation"
            topIcon={<icons.onReserve className="text-white text-2xl" />}
          />
          <Card
            className="on-ended"
            title="Ended"
            url={""}
            amount="5"
            description="Total Booked Ended"
            topIcon={<icons.onEnded className="text-white text-2xl" />}
          />
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="text-end ">
          <CustomButtons
            children="Add Renter"
            className="py-2 px-4 rounded menu-bg text-white cursor-pointer"
          />
        </div>
        <div className="flex flex-col gap-2 w-full px-6 border border-gray-400 py-4 rounded ">
          <div className="flex items-center justify-end gap-3">
            <div className="">
              <div
                onClick={() => setToggle((t) => !t)}
                className="flex justify-center items-center border border-gray-200 rounded"
              >
                <select
                  onChange={(e) => setSelectValue(e.target.value)}
                  value={selectValue}
                  className=" w-full rounded appearance-none bg-transparent outline-none  px-4 py-2 cursor-pointer"
                >
                  <option value="" >All</option>
                  <option value="On Service">On-Service</option>
                  <option value="Reserved" > Reserved</option>
                  <option value="Ended"> Ended</option>
                </select>
                <div className="mr-2">{toggle ? <icons.up /> : <icons.down />}</div>
              </div>
            </div>
            <div className="">
              <SearchBar
                onClear={() => setSearchTerm("")}
                value={searchTerm}
                className="  bg-gray-100 rounded py-2 w-60 "
                placeholder="Search"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className=" rounded mt-2">
            <TableData
              progressPending={false}
              highlightOnHover={true}
              pagination={true}
              title={<span className="font-bold">Bookings</span>}
              data={records}
              columns={columns}
              fixedHeader={true}
              responsive={true}
              fixedHeaderScrollHeight="500px "
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bookings;
