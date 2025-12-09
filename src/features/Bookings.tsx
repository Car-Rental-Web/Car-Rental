import { useEffect, useState } from "react";
import TableData from "../components/TableData";
import type { DataBookingProps } from "../types/types";
import { BsThreeDots } from "react-icons/bs";
import { useDebouncedValue } from "../utils/useDebounce";
import { filterData } from "../utils/FilterData";
import SearchBar from "../components/SearchBar";
import Card from "../components/Card";
import icons from "../constants/icon";
import { CustomButtons } from "../components/CustomButtons";
import { BookingForm } from "../modals";

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
        className={`text-[8px] xl:text-xs text-center px-4 py-1 ${
          row.status === "On Service"
            ? "bg-green-800 text-white  rounded-full w-full text-center"
            : row.status === "Reserved"
            ? " bg-blue-900   rounded-full text-white w-full text-center"
            : row.status === "Ended"
            ? "bg-red-900 text-white  rounded-full w-full text-center"
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
  const [openModal, setOpenModal] = useState(false)
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
    <div className="w-full relative  overflow-y-auto  flex flex-col gap-5  pt-12 px-6 bg-body">
      <div className="">
        <p className="text-5xl font-semibold text-gray-600 tracking-wide mb-5">
          Bookings
        </p>
        <div className="flex flex-col xl:flex-row gap-2">
          <Card
            className="bg-border w-full"
            title={<span className="text-md xl:text-3xl">On Service</span>}
            url={""}
            amount={<span className="text-6xl">200</span>}
            description="Total Booked On Service"
            topIcon={<icons.onService className="text-white text-2xl" />}
          />
          <Card
            className="bg-border w-full"
            title={<span className="text-md xl:text-3xl">On Reservation</span>}
            url={""}
            amount={<span className="text-6xl">200</span>}
            description="Total Booked Reservation"
            topIcon={<icons.onReserve className="text-white text-2xl" />}
          />
          <Card
            className="bg-border w-full"
            title={<span className="text-md xl:text-3xl">On Ended</span>}
            url={""}
            amount={<span className="text-6xl">200</span>}
            description="Total Booked Ended"
            topIcon={<icons.onEnded className="text-white text-2xl" />}
          />
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="text-end ">
          <CustomButtons
          handleclick={() => setOpenModal(true)}
            children="Add Renter"
            className="py-1 md:py-2 px-2 md:px-4  rounded button-color menu-bg text-white cursor-pointer text-xs md:text-base "
          />
          <BookingForm open={openModal} onClose={() => setOpenModal(false)}/>
        </div>
        <div className="flex flex-col gap-2 px-6 border border-gray-400 py-2 rounded ">
          <div className="flex w-full justify-end gap-3">
              <div
                onClick={() => setToggle((t) => !t)}
                className="flex relative border border-gray-200 rounded w-full  md:w-44"
              >
                <select
                  onChange={(e) => setSelectValue(e.target.value)}
                  value={selectValue}
                  className=" w-full  rounded appearance-none outline-none  px-4 py-2 cursor-pointer text-xs xl:text-base text-white"
                >
                  <option value=""  className="txt-color">All</option>
                  <option value="On Service" className="txt-color">On-Service</option>
                  <option value="Reserved"  className="txt-color"> Reserved</option>
                  <option value="Ended" className="txt-color"> Ended</option>
                </select>
                <div className="absolute top-2 xl:top-3 right-3 txt-color"> {toggle ? <icons.up/> : <icons.down/>}</div>
              </div>
            <div className="">
              <SearchBar
                onClear={() => setSearchTerm("")}
                value={searchTerm}
                className="  bg-border text-white  rounded py-2 w-60 "
                placeholder="Search"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className=" rounded mt-2">
            <TableData
              progressPending={false}
              pagination={true}
              title={<span className="font-bold">Bookings</span>}
              data={records}
              columns={columns}
              fixedHeader={true}
              responsive={true}
              fixedHeaderScrollHeight="350px"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bookings;
