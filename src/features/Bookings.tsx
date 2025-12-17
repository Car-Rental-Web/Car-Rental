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
import { BsThreeDots } from "react-icons/bs";
import { toast } from "react-toastify";
import DeleteModal from "../modals/DeleteModal";
import to12Hour from "../utils/timeFormatter";

const Bookings = () => {
  const [records, setRecords] = useState<DataBookingProps[]>([]);
  const [filterRecords, setFilterRecords] = useState<DataBookingProps[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [toggle, setToggle] = useState(false);
  const [selectValue, setSelectValue] = useState("");
  const debounceSearchTerm = useDebouncedValue(searchTerm, 200);
  const [openDelete, setOpenDelete] = useState(false);
  const { open, onOpen, onClose } = useModalStore();

  useEffect(() => {
    onClose();
  }, [onClose]);

  const handleDelete = async (id: number, vehicleId: string) => {
    const { data, error } = await supabase
      .from("booking")
      .delete()
      .eq("id", id);
    if (error) {
      console.log("Failed to Delete", error);
      toast.error("Failed to Delete");
      return;
    }
    console.log("Deleted Successfully", data);
    toast.success("Deleted Succesfully");

    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicle")
      .update({ status: "Available" })
      .eq("plate_no", vehicleId);

    if (vehicleError) {
      console.log("Error Changing Status in Vehicle");
      toast.error("Error Changing Status in Vehicle");
      return;
    }
    console.log("Successfully changing status in Vehicle", vehicle);

    setOpenDelete(false);
    setRecords((records) => records.filter((row) => row.id !== id));
    setFilterRecords((records) => records.filter((row) => row.id !== id));
  };

  useEffect(() => {
    let isMounted = true;
    const fetchBookingData = async () => {
      try {
        const { data, error } = await supabase
          .from("booking")
          .select(
            "id, full_name, license_number, car_model, car_type, start_date, end_date, start_time, end_time, location, type_of_rent, status"
          );
        if (!isMounted) return;

        const row = data ?? [];
        const rowData = row.map((item) => ({
          id: item.id,
          full_name: item.full_name,
          license_number: item.license_number,
          car_model: item.car_model,
          car_type: item.car_type,
          start_date: item.start_date,
          end_date: item.end_date,
          start_time: item.start_time,
          end_time: item.end_time,
          location: item.location,
          type_of_rent: item.type_of_rent,
          status: item.status,
          action: <BsThreeDots />,
        }));
        setFilterRecords(rowData);
        setRecords(rowData);
        if (error) {
          console.log("Error Fetching Data", error);
          return;
        }
        console.log("Sucessful fetch data", data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchBookingData();
    return () => {
      isMounted = false;
    };
  }, [open]);

  useEffect(() => {
    let result = filterData(debounceSearchTerm, filterRecords, [
      "car_type",
      "car_model",
      "start_date",
      "license_number",
      "end_date",
      "location",
      "full_name",
      "status",
    ]);

    if (selectValue !== "") {
      result = result.filter((item) => item.status === selectValue);
    }
    setRecords(result);
  }, [debounceSearchTerm, selectValue, filterRecords]);

  const onService = records.filter(
    (item) => item.status === "On Service"
  ).length;

  const onReservation = records.filter(
    (item) => item.status === "On Reservation"
  ).length;

  const onComplete = records.filter(
    (item) => item.status === "Completed"
  ).length;

  const totalBookings = records.length;

  const columns = [
    {
      name: "No.",
      cell: (_row: DataBookingProps, index: number) => (
        <div className="text-center font-semibold ">{index + 1}</div>
      ),
    },
    {
      name: "Name",
      cell: (row: DataBookingProps) => (
        <div className="text-center font-semibold">{row.full_name}</div>
      ),
    },
    {
      name: "License #",
      cell: (row: DataBookingProps) => (
        <div className="text-center font-semibold">{row.license_number}</div>
      ),
    },
    {
      name: "Car",
      cell: (row: DataBookingProps) => (
        <div className="text-center font-semibold">{row.car_type}</div>
      ),
    },
    {
      name: "Model",
      cell: (row: DataBookingProps) => (
        <div className="text-center font-semibold">{row.car_model}</div>
      ),
    },
    {
      name: "Start Date",
      cell: (row: DataBookingProps) => (
        <div className="text-center ">
          {new Date(row.start_date).toLocaleString("en-US", {
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
          {new Date(row.end_date).toLocaleString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          })}
        </div>
      ),
    },
    {
      name: "Pick up",
      cell: (row: DataBookingProps) => (
        <div className="text-center ">
          {to12Hour(row.start_time)}
        </div>
      ),
    },
    {
      name: "Drop off",
      cell: (row: DataBookingProps) => (
        <div className="text-center ">
         {to12Hour(row.end_time)}
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
      cell: (row: DataBookingProps) => <div>{row.type_of_rent}</div>,
    },
    {
      name: "Status",
      cell: (row: DataBookingProps) => (
        <span
          className={` rounded-full w-full px-2 py-1 text-[6px] sm:text-[8px] md:text-[9px] lg:text-[10] xl:text-[12px] ${
            row.status === "On Service"
              ? "bg-green-800 text-white  rounded-full w-full text-center"
              : row.status === "On Reservation"
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
      cell: (row: DataBookingProps) => (
        <div className="flex gap-2">
          <icons.openEye
            className="cursor-pointer text-blue-400 text-xl"
            // onClick={() => handleView(row)}
          />
          <icons.edit
            className="cursor-pointer text-green-400 text-xl"
            // onClick={() => handleUpdate(row.id, row.car)}
          />
          <icons.trash
            className="cursor-pointer text-red-400 text-xl"
            onClick={() => setOpenDelete(true)}
          />
          <DeleteModal
            open={openDelete}
            onClose={() => setOpenDelete(false)}
            onClick={() => handleDelete(row.id, row.car_model)}
          />
        </div>
      ),
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
            amount={<span className="text-6xl">{onService}</span>}
            description="Total Booked On Service"
            topIcon={<icons.onService className="text-white text-2xl" />}
          />
          <Card
            className="bg-border w-full"
            title={<span className="text-md xl:text-2xl">On Reservation</span>}
            url={""}
            amount={<span className="text-6xl">{onReservation}</span>}
            description="Total Booked Reservation"
            topIcon={<icons.onReserve className="text-white text-2xl" />}
          />
          <Card
            className="bg-border w-full"
            title={<span className="text-md xl:text-2xl">Completed</span>}
            url={""}
            amount={<span className="text-6xl">{onComplete}</span>}
            description="Total Booked Ended"
            topIcon={<icons.onEnded className="text-white text-2xl" />}
          />
          <Card
            className="bg-border w-full"
            title={<span className="text-md xl:text-2xl">Total Bookings</span>}
            url={""}
            amount={<span className="text-6xl">{totalBookings}</span>}
            description="Total Bookings"
            topIcon={<icons.all className="text-white text-2xl" />}
          />
        </div>
      </div>
      <div className="flex flex-col gap-6 ">
        <div className="text-end flex justify-end ">
          <CustomButtons
          icons ={<icons.add className="text-xl text-white"/>}
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
                <option value="On Reservation" className="txt-color">
                  Reserved
                </option>
                <option value="Completed" className="txt-color">
                  Completed
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
