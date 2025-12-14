import { useEffect, useState } from "react";
import TableData from "../components/TableData";
import type { DataBookingProps } from "../types/types";
import { useDebouncedValue } from "../utils/useDebounce";
import { filterData } from "../utils/FilterData";
import SearchBar from "../components/SearchBar";
import Card from "../components/Card";
import icons from "../constants/icon";
import { CustomButtons } from "../components/CustomButtons";
import { BookingForm } from "../modals";
import { useModalStore } from "../store/useModalStore";
import { supabase } from "../utils/supabase";



const Bookings = () => {
  const [records, setRecords] = useState<DataBookingProps[]>([]);
  const [filterRecords, setFilterRecords] = useState<DataBookingProps[]>(
      []
    );
  const [searchTerm, setSearchTerm] = useState("");
  const [toggle, setToggle] = useState(false);
  const [selectValue, setSelectValue] = useState("");
  const debounceSearchTerm = useDebouncedValue(searchTerm, 200);
  const { open, onOpen, onClose } = useModalStore();

  useEffect(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
      const fetchBookingData = async () => {
        const {data, error} = await supabase.from('booking').select('fullname,license_number,car_model, car_type,start_date,end_date,start_time,end_time,location,type_of_rent,')
      }
  })


  useEffect(() => {
    let result = filterData(debounceSearchTerm, filterRecords, [
      "carType",
      "model",
      "startDate",
      "license",
      "endDate",
      "location",
      "name",
      "status",
    ]);

    if (selectValue !== "") {
      result = result.filter((item) => item.status === selectValue);
    }
    setRecords(result);
  }, [debounceSearchTerm, selectValue, filterRecords]);

  const columns = [
    {
      name: "No.",
      cell: (row: DataBookingProps) => (
        <div className="text-center font-semibold ">{row.id}</div>
      ),
    },
    {
      name: "Name",
      cell: (row: DataBookingProps) => (
        <div className="text-center font-semibold">{row.name}</div>
      ),
    },
    {
      name: "License #",
      cell: (row: DataBookingProps) => (
        <div className="text-center font-semibold">{row.license}</div>
      ),
    },
    {
      name: "Car",
      cell: (row: DataBookingProps) => (
        <div className="text-center font-semibold">{row.carType}</div>
      ),
    },
    {
      name: "Model",
      cell: (row: DataBookingProps) => (
        <div className="text-center font-semibold">{row.model}</div>
      ),
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
      cell: (row: DataBookingProps) => (
        <div className="text-center ">{row.location}</div>
      ),
    },
    {
      name: "Type of Rent",
      cell: (row: DataBookingProps) => <div>{row.typeOfRent}</div>,
    },
    {
      name: "Status",
      cell: (row: DataBookingProps) => (
        <span
          className={` rounded-full w-full px-2 py-1 text-[6px] sm:text-[8px] md:text-[9px] lg:text-[10] xl:text-[12px] ${
            row.status === "On Service"
              ? "bg-green-800 text-white  rounded-full w-full text-center"
              : row.status === "Reserved"
              ? " bg-blue-900   rounded-full text-white w-full text-center"
              : row.status === "Completed"
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
      cell: (row: DataBookingProps) => <div className="">{row.action}</div>,
    },
  ];
  return (
    <div className="w-full relative min-h-screen  overflow-y-auto  flex flex-col gap-5  pt-12 pb-2 px-6 bg-body">
      <div className="">
        <p className="text-5xl font-semibold text-gray-300 tracking-wide pb-5">
          Bookings
        </p>
        <div className="flex flex-col xl:flex-row gap-2">
          <Card
            className="bg-border w-full"
            title={<span className="text-md xl:text-2xl">On Service</span>}
            url={""}
            amount={<span className="text-6xl">200</span>}
            description="Total Booked On Service"
            topIcon={<icons.onService className="text-white text-2xl" />}
          />
          <Card
            className="bg-border w-full"
            title={<span className="text-md xl:text-2xl">On Reservation</span>}
            url={""}
            amount={<span className="text-6xl">200</span>}
            description="Total Booked Reservation"
            topIcon={<icons.onReserve className="text-white text-2xl" />}
          />
          <Card
            className="bg-border w-full"
            title={<span className="text-md xl:text-2xl">On Ended</span>}
            url={""}
            amount={<span className="text-6xl">200</span>}
            description="Total Booked Ended"
            topIcon={<icons.onEnded className="text-white text-2xl" />}
          />
          <Card
            className="bg-border w-full"
            title={<span className="text-md xl:text-2xl">Total Bookings</span>}
            url={""}
            amount={<span className="text-6xl">200</span>}
            description="Total Bookings"
            topIcon={<icons.all className="text-white text-2xl" />}
          />
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="text-end ">
          <CustomButtons
            handleclick={onOpen}
            children="Add Renter"
            className="py-1 md:py-2 px-2 md:px-4  rounded bg-[#4E8EA2] hover:bg-[#1d596b] text-white cursor-pointer text-xs md:text-base "
          />
          <BookingForm open={open} onClose={onClose} />
        </div>
        <div className="flex flex-col gap-2 px-6 border border-gray-400 py-2 rounded ">
          <div className="flex pb-4 pt-4 w-full justify-end gap-3">
            <div
              onClick={() => setToggle((t) => !t)}
              className="flex relative border border-gray-200 rounded w-full  md:w-44"
            >
              <select
                onChange={(e) => setSelectValue(e.target.value)}
                value={selectValue}
                className=" w-full  rounded appearance-none outline-none  px-4 py-2 cursor-pointer text-xs xl:text-base text-white"
              >
                <option value="" className="txt-color">
                  All
                </option>
                <option value="On Service" className="txt-color">
                  On-Service
                </option>
                <option value="Reserved" className="txt-color">
                  {" "}
                  Reserved
                </option>
                <option value="Ended" className="txt-color">
                  {" "}
                  Ended
                </option>
              </select>
              <div className="absolute top-2 xl:top-3 right-3 txt-color">
                {" "}
                {toggle ? <icons.up /> : <icons.down />}
              </div>
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
